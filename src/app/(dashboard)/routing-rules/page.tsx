import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { RoutingRulesView } from "@/components/routing-rules/routing-rules-view";

export default async function RoutingRulesPage() {
  const supabase = await createClient();

  const [{ data: rules }, { data: buyers }] = await Promise.all([
    supabase
      .from("routing_rules")
      .select(
        "id, org_id, name, is_active, priority, states, product_types, min_intent_score, max_intent_score, sources, strategy, created_at, updated_at"
      )
      .order("priority", { ascending: true }),
    supabase.from("buyers").select("*").order("name", { ascending: true }),
  ]);

  const ruleIds = (rules ?? []).map((r) => r.id);
  const { data: ruleBuyers } =
    ruleIds.length > 0
      ? await supabase
          .from("routing_rule_buyers")
          .select("routing_rule_id, buyer_id")
          .in("routing_rule_id", ruleIds)
      : { data: [] as { routing_rule_id: string; buyer_id: string }[] };

  const buyerIdsByRule: Record<string, string[]> = {};
  for (const rb of ruleBuyers ?? []) {
    (buyerIdsByRule[rb.routing_rule_id] ??= []).push(rb.buyer_id);
  }

  const buyerNamesById: Record<string, string> = {};
  for (const buyer of buyers ?? []) {
    buyerNamesById[buyer.id] = buyer.name;
  }

  return (
    <div>
      <PageHeader
        title="Routing Rules"
        description="Evaluated in priority order for every incoming lead — first match wins."
      />
      <RoutingRulesView
        rules={rules ?? []}
        buyers={buyers ?? []}
        buyerIdsByRule={buyerIdsByRule}
        buyerNamesById={buyerNamesById}
      />
    </div>
  );
}
