"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import { routeLead } from "@/lib/routing/engine";
import type { RouteLeadResult } from "@/lib/routing/types";
import type { Database, RoutingOutcome } from "@/lib/types/database";

const TEST_BUYER_PREFIX = "[TEST] ";
const TEST_EMAIL_DOMAIN = "@dev-test.leadshift.local";

function isDevToolsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

const US_STATE_SAMPLE = ["TX", "FL", "CA", "NY", "OH", "GA"];
const PRODUCT_SAMPLE = ["iul", "term", "final_expense", "annuity"];

export interface DevActionResult {
  error?: string;
  count?: number;
}

export async function createFakeBuyers(count: number): Promise<DevActionResult> {
  if (!isDevToolsEnabled()) return { error: "Dev tools are disabled in production." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const rows = Array.from({ length: count }, (_, i) => {
    const n = Date.now() % 100000 + i;
    return {
      org_id: orgId,
      name: `${TEST_BUYER_PREFIX}Buyer ${n}`,
      email: `buyer-${n}${TEST_EMAIL_DOMAIN}`,
      status: "active" as const,
      states: Math.random() > 0.5 ? [US_STATE_SAMPLE[i % US_STATE_SAMPLE.length]] : [],
      product_types: Math.random() > 0.5 ? [PRODUCT_SAMPLE[i % PRODUCT_SAMPLE.length]] : [],
      min_intent_score: Math.floor(Math.random() * 40),
      price_per_lead: Math.round((10 + Math.random() * 40) * 100) / 100,
      weight: 1 + Math.floor(Math.random() * 5),
      priority: Math.floor(Math.random() * 5),
      daily_cap: Math.random() > 0.3 ? 5 + Math.floor(Math.random() * 10) : null,
      weekly_cap: null,
      monthly_cap: null,
    };
  });

  const { error } = await supabase.from("buyers").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dev");
  revalidatePath("/buyers");
  return { count: rows.length };
}

export async function createFakeLeads(count: number): Promise<DevActionResult> {
  if (!isDevToolsEnabled()) return { error: "Dev tools are disabled in production." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const rows = Array.from({ length: count }, (_, i) => {
    const n = Date.now() % 100000 + i;
    return {
      org_id: orgId,
      source: "manual" as const,
      status: "new" as const,
      name: `Test Lead ${n}`,
      email: `lead-${n}${TEST_EMAIL_DOMAIN}`,
      phone: `555${String(1000000 + n).slice(0, 7)}`,
      state: US_STATE_SAMPLE[i % US_STATE_SAMPLE.length],
      product_type: PRODUCT_SAMPLE[i % PRODUCT_SAMPLE.length],
      intent_score: Math.floor(Math.random() * 100),
    };
  });

  const { error } = await supabase.from("leads").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/dev");
  revalidatePath("/leads");
  return { count: rows.length };
}

export interface RunEngineInput {
  state: string;
  productType: string;
  intentLevel: "low" | "medium" | "high";
}

export interface RoutingEventDisplay {
  buyerName: string | null;
  outcome: RoutingOutcome;
  explanation: string | null;
}

export interface RunEngineResult {
  error?: string;
  result?: RouteLeadResult;
  events?: RoutingEventDisplay[];
}

const INTENT_ANSWER_WEIGHT: Record<RunEngineInput["intentLevel"], number> = {
  low: -20,
  medium: 0,
  high: 30,
};

export async function runFakeQuizSubmission(input: RunEngineInput): Promise<RunEngineResult> {
  if (!isDevToolsEnabled()) return { error: "Dev tools are disabled in production." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const n = Date.now() % 100000;

  const result = await routeLead({
    orgId,
    source: "quiz",
    name: `Test Quiz Lead ${n}`,
    email: `quiz-${n}${TEST_EMAIL_DOMAIN}`,
    phone: `555${String(2000000 + n).slice(0, 7)}`,
    state: input.state,
    productType: input.productType,
    answers: { dev_tools_intent: INTENT_ANSWER_WEIGHT[input.intentLevel] > 0 ? "yes" : "no" },
    rawPayload: { source: "dev-tools", intentLevel: input.intentLevel },
  });

  const { data: events } = await supabase
    .from("routing_events")
    .select("outcome, explanation, buyer_id, buyers(name)")
    .eq("lead_id", result.leadId)
    .order("attempt_order", { ascending: true });

  const eventsDisplay: RoutingEventDisplay[] = (events ?? []).map((e) => ({
    buyerName: (e.buyers as unknown as { name: string } | null)?.name ?? null,
    outcome: e.outcome,
    explanation: e.explanation,
  }));

  revalidatePath("/dev");
  revalidatePath("/leads");
  revalidatePath("/buyers");

  return { result, events: eventsDisplay };
}

export interface BuyerCapRow {
  id: string;
  name: string;
  status: Database["public"]["Tables"]["buyers"]["Row"]["status"];
  daily_count: number;
  daily_cap: number | null;
  weekly_count: number;
  weekly_cap: number | null;
  monthly_count: number;
  monthly_cap: number | null;
}

export async function resetTestData(): Promise<DevActionResult> {
  if (!isDevToolsEnabled()) return { error: "Dev tools are disabled in production." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error: leadsError } = await supabase
    .from("leads")
    .delete()
    .eq("org_id", orgId)
    .like("email", `%${TEST_EMAIL_DOMAIN}`);

  const { error: buyersError } = await supabase
    .from("buyers")
    .delete()
    .eq("org_id", orgId)
    .like("name", `${TEST_BUYER_PREFIX}%`);

  if (leadsError || buyersError) {
    return { error: leadsError?.message ?? buyersError?.message };
  }

  revalidatePath("/dev");
  revalidatePath("/leads");
  revalidatePath("/buyers");
  return {};
}
