import { Route, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";

const STRATEGY_LABEL: Record<string, string> = {
  priority: "Priority order",
  weighted_round_robin: "Weighted round robin",
  highest_price: "Highest price wins",
  highest_intent_match: "Best intent match",
};

export default async function RoutingRulesPage() {
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("routing_rules")
    .select(
      "id, name, is_active, priority, states, product_types, min_intent_score, max_intent_score, strategy"
    )
    .order("priority", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Routing Rules"
        description="Evaluated in priority order for every incoming lead — first match wins."
        action={
          <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            New rule
          </button>
        }
      />

      {rules && rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {rule.priority}
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {rule.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {rule.states.length > 0 ? rule.states.join(", ") : "All states"}
                    {" · "}
                    Intent {rule.min_intent_score}-{rule.max_intent_score}
                    {" · "}
                    {STRATEGY_LABEL[rule.strategy] ?? rule.strategy}
                  </p>
                </div>
              </div>
              <Badge tone={rule.is_active ? "green" : "slate"}>
                {rule.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Route}
          title="No routing rules yet"
          description="Define conditions on state, product, and intent score, then choose a strategy to pick among matching buyers."
        />
      )}
    </div>
  );
}
