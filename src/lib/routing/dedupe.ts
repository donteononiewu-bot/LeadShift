import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LeadDuplicateStatus } from "@/lib/types/database";

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

  const orFilters: string[] = [];
  if (email) orFilters.push(`email.eq.${email}`);
  if (phone) orFilters.push(`phone.eq.${phone}`);

  const { data: matches } = await admin
    .from("leads")
    .select("id, email, phone, created_at")
    .eq("org_id", orgId)
    .or(orFilters.join(","))
    .order("created_at", { ascending: false })
    .limit(5);

  if (!matches || matches.length === 0) {
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
