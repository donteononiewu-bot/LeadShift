import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<string, "slate" | "green" | "red" | "amber" | "brand"> = {
  new: "brand",
  routing: "amber",
  routed: "green",
  sold: "green",
  rejected: "red",
  failed: "red",
  unmatched: "amber",
};

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, name, email, phone, state, source, status, intent_score, product_type, duplicate_status, created_at, buyers:assigned_buyer_id(name)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every lead captured across quizzes, webhooks, Zapier, and Meta Lead Ads."
      />

      {leads && leads.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Duplicate</th>
                <th className="px-4 py-3 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {lead.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {lead.email || lead.phone || "—"}
                  </td>
                  <td className="px-4 py-3">{lead.state ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">
                    {lead.source.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">{lead.intent_score}</td>
                  <td className="px-4 py-3">
                    {(lead.buyers as unknown as { name: string } | null)?.name ??
                      "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[lead.status] ?? "slate"}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {lead.duplicate_status === "unique" ? (
                      "—"
                    ) : (
                      <Badge
                        tone={
                          lead.duplicate_status === "duplicate" ? "red" : "amber"
                        }
                      >
                        {lead.duplicate_status.replace("_", " ")}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(lead.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Once quizzes, webhooks, Zapier, or Meta Lead Ads start sending leads, they'll appear here in real time."
        />
      )}
    </div>
  );
}
