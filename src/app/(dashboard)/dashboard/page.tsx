import { Users, Zap, Timer, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { History } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { count: totalLeads },
    { count: leadsToday },
    { count: routedToday },
    { count: activeBuyers },
    { data: recentLeads },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "routed")
      .gte("routed_at", startOfToday.toISOString()),
    supabase
      .from("buyers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("leads")
      .select("id, first_name, last_name, state, source, status, intent_score, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("system_events")
      .select("id, message, severity, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const avgRoutingMs = 0; // populated once live routing attempts accumulate

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live view of lead flow and routing performance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={String(totalLeads ?? 0)}
          icon={Users}
          hint={`${leadsToday ?? 0} captured today`}
        />
        <StatCard
          label="Routed today"
          value={String(routedToday ?? 0)}
          icon={Zap}
          hint="Leads successfully assigned"
        />
        <StatCard
          label="Avg. routing time"
          value={avgRoutingMs ? `${avgRoutingMs}ms` : "—"}
          icon={Timer}
          hint="Target: under 2,000ms"
        />
        <StatCard
          label="Active buyers"
          value={String(activeBuyers ?? 0)}
          icon={Building2}
          hint="Currently eligible for routing"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Recent leads
          </h2>
          {recentLeads && recentLeads.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLeads.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {[lead.first_name, lead.last_name]
                        .filter(Boolean)
                        .join(" ") || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lead.state ?? "—"} &middot; {lead.source}
                    </p>
                  </div>
                  <Badge
                    tone={
                      lead.status === "routed"
                        ? "green"
                        : lead.status === "rejected" || lead.status === "failed"
                        ? "red"
                        : "slate"
                    }
                  >
                    {lead.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Users}
              title="No leads yet"
              description="Leads captured from quizzes, webhooks, Zapier, and Meta Lead Ads will show up here."
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            System activity
          </h2>
          {recentEvents && recentEvents.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentEvents.map((event) => (
                <li key={event.id} className="py-3 text-sm">
                  <p className="text-slate-700 dark:text-slate-300">
                    {event.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={History}
              title="No activity yet"
              description="Routing decisions, integration events, and settings changes will appear here."
            />
          )}
        </div>
      </div>
    </div>
  );
}
