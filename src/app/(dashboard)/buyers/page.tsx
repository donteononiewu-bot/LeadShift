import { Building2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";

export default async function BuyersPage() {
  const supabase = await createClient();

  const { data: buyers } = await supabase
    .from("buyers")
    .select(
      "id, name, status, states, product_types, price_per_lead, daily_cap, daily_count, weekly_cap, weekly_count, monthly_cap, monthly_count"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Buyers"
        description="Who receives your leads, and how much of each they'll take."
        action={
          <button className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            Add buyer
          </button>
        }
      />

      {buyers && buyers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {buyer.name}
                </h3>
                <Badge tone={buyer.status === "active" ? "green" : "slate"}>
                  {buyer.status}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {buyer.states.length > 0 ? buyer.states.join(", ") : "All states"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {buyer.product_types.length > 0
                  ? buyer.product_types.join(", ")
                  : "All products"}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  Price/lead
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  ${Number(buyer.price_per_lead).toFixed(2)}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <CapRow label="Daily" used={buyer.daily_count} cap={buyer.daily_cap} />
                <CapRow
                  label="Weekly"
                  used={buyer.weekly_count}
                  cap={buyer.weekly_cap}
                />
                <CapRow
                  label="Monthly"
                  used={buyer.monthly_count}
                  cap={buyer.monthly_cap}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No buyers yet"
          description="Add the businesses that purchase your leads, along with their caps, states, and delivery method."
        />
      )}
    </div>
  );
}

function CapRow({
  label,
  used,
  cap,
}: {
  label: string;
  used: number;
  cap: number | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label} cap</span>
      <span>{cap === null ? `${used} / unlimited` : `${used} / ${cap}`}</span>
    </div>
  );
}
