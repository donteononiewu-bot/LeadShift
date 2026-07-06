import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";

export default async function SystemHistoryPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("system_events")
    .select("id, severity, entity_type, event_type, message, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        title="System History"
        description="An append-only log of every lead capture, routing decision, and integration event."
      />

      {events && events.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {event.event_type}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-500 dark:text-slate-400">
                    {event.entity_type}
                  </td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white">
                    {event.message}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        event.severity === "error"
                          ? "red"
                          : event.severity === "warning"
                          ? "amber"
                          : "slate"
                      }
                    >
                      {event.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No events recorded yet"
          description="Every lead capture, routing decision, and integration sync will be logged here for auditing."
        />
      )}
    </div>
  );
}
