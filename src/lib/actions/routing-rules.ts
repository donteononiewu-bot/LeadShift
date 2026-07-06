"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import type { LeadSourceType, RoutingStrategy } from "@/lib/types/database";

export interface RoutingRuleFormValues {
  name: string;
  isActive: boolean;
  priority: number;
  states: string[];
  productTypes: string[];
  minIntentScore: number;
  maxIntentScore: number;
  sources: LeadSourceType[];
  strategy: RoutingStrategy;
  buyerIds: string[];
}

export interface RoutingRuleActionResult {
  error?: string;
  ruleId?: string;
}

async function assertRuleOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ruleId: string
): Promise<string | null> {
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return null;
  const { data } = await supabase
    .from("routing_rules")
    .select("id")
    .eq("id", ruleId)
    .eq("org_id", orgId)
    .maybeSingle();
  return data ? orgId : null;
}

async function syncRuleBuyers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ruleId: string,
  buyerIds: string[]
) {
  await supabase.from("routing_rule_buyers").delete().eq("routing_rule_id", ruleId);
  if (buyerIds.length > 0) {
    await supabase.from("routing_rule_buyers").insert(
      buyerIds.map((buyerId) => ({ routing_rule_id: ruleId, buyer_id: buyerId }))
    );
  }
}

function ruleRowFromValues(orgId: string, values: RoutingRuleFormValues) {
  return {
    org_id: orgId,
    name: values.name.trim(),
    is_active: values.isActive,
    priority: values.priority,
    states: values.states,
    product_types: values.productTypes,
    min_intent_score: values.minIntentScore,
    max_intent_score: values.maxIntentScore,
    sources: values.sources,
    strategy: values.strategy,
  };
}

export async function createRoutingRule(
  values: RoutingRuleFormValues
): Promise<RoutingRuleActionResult> {
  if (!values.name.trim()) return { error: "Rule name is required." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("routing_rules")
    .insert(ruleRowFromValues(orgId, values))
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create rule." };

  await syncRuleBuyers(supabase, data.id, values.buyerIds);

  revalidatePath("/routing-rules");
  return { ruleId: data.id };
}

export async function updateRoutingRule(
  ruleId: string,
  values: RoutingRuleFormValues
): Promise<RoutingRuleActionResult> {
  if (!values.name.trim()) return { error: "Rule name is required." };

  const supabase = await createClient();
  const orgId = await assertRuleOwnership(supabase, ruleId);
  if (!orgId) return { error: "Not authorized." };

  const { error } = await supabase
    .from("routing_rules")
    .update(ruleRowFromValues(orgId, values))
    .eq("id", ruleId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  await syncRuleBuyers(supabase, ruleId, values.buyerIds);

  revalidatePath("/routing-rules");
  return { ruleId };
}

export async function setRoutingRuleActive(
  ruleId: string,
  isActive: boolean
): Promise<RoutingRuleActionResult> {
  const supabase = await createClient();
  const orgId = await assertRuleOwnership(supabase, ruleId);
  if (!orgId) return { error: "Not authorized." };

  const { error } = await supabase
    .from("routing_rules")
    .update({ is_active: isActive })
    .eq("id", ruleId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/routing-rules");
  return { ruleId };
}

export async function deleteRoutingRule(ruleId: string): Promise<RoutingRuleActionResult> {
  const supabase = await createClient();
  const orgId = await assertRuleOwnership(supabase, ruleId);
  if (!orgId) return { error: "Not authorized." };

  const { error } = await supabase
    .from("routing_rules")
    .delete()
    .eq("id", ruleId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/routing-rules");
  return { ruleId };
}
