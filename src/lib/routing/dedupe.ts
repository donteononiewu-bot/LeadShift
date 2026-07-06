import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LeadDuplicateStatus } from "@/lib/types/database";
import { logSystemEvent } from "./logging";

const RECENT_RESUBMISSION_WINDOW_MS = 5 * 60 * 1000;

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Strip a US country code prefix so "+1 555-123-4567" == "555-123-4567".
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export interface DuplicateCheckResult {
  status: LeadDuplicateStatus;
  duplicateOfLeadId: string | null;
  /** True when the same email+phone was submitted moments ago — likely an accidental double-submit. */
  isRecentResubmission: boolean;
}

/**
 * Looks up prior leads in this org by normalized email/phone. A match on
 * both fields is high-confidence ('duplicate'); a match on only one is
 * lower-confidence ('possible_duplicate'). No unique constraint exists on
 * leads.email/phone by design — the same person can legitimately convert
 * more than once over time.
 */
export async function findDuplicate(
  admin: SupabaseClient<Database>,
  orgId: string,
  email: string | null,
  phone: string | null
): Promise<DuplicateCheckResult> {
  if (!email && !phone) {
    return { status: "unique", duplicateOfLeadId: null, isRecentResubmission: false };
  }

  // Two separate parameterized queries rather than a hand-built PostgREST
  // `.or()` filter string — email/phone come from untrusted external
  // payloads, and values containing a comma or parenthesis would otherwise
  // break (or be mis-parsed by) the `.or()` mini-language.
  const [emailResult, phoneResult] = await Promise.all([
    email
      ? admin
          .from("leads")
          .select("id, email, phone, created_at")
          .eq("org_id", orgId)
          .eq("email", email)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    phone
      ? admin
          .from("leads")
          .select("id, email, phone, created_at")
          .eq("org_id", orgId)
          .eq("phone", phone)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (emailResult.error || phoneResult.error) {
    // Blocking the whole lead capture on a transient dedup-check failure
    // would be worse than occasionally missing a duplicate, but silently
    // reporting "unique" with no trace is exactly the bug being fixed here
    // — log it so a spike in lookup failures is visible in System History.
    await logSystemEvent(admin, {
      orgId,
      severity: "error",
      entityType: "lead",
      eventType: "dedupe.lookup_failed",
      message: `Duplicate lookup failed, treating as unique: ${
        emailResult.error?.message ?? phoneResult.error?.message
      }`,
    });
    return { status: "unique", duplicateOfLeadId: null, isRecentResubmission: false };
  }

  const byId = new Map<string, { id: string; email: string | null; phone: string | null; created_at: string }>();
  for (const row of [...(emailResult.data ?? []), ...(phoneResult.data ?? [])]) {
    byId.set(row.id, row);
  }
  const matches = Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (matches.length === 0) {
    return { status: "unique", duplicateOfLeadId: null, isRecentResubmission: false };
  }

  const bothMatch = matches.find(
    (m) => email && phone && m.email === email && m.phone === phone
  );
  const best = bothMatch ?? matches[0];
  const status: LeadDuplicateStatus = bothMatch ? "duplicate" : "possible_duplicate";

  const ageMs = Date.now() - new Date(best.created_at).getTime();
  const isRecentResubmission = Boolean(bothMatch) && ageMs < RECENT_RESUBMISSION_WINDOW_MS;

  return { status, duplicateOfLeadId: best.id, isRecentResubmission };
}
