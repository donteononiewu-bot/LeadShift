import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { DevToolsView } from "@/components/dev/dev-tools-view";

export default async function DevToolsPage() {
  const isProd = process.env.NODE_ENV === "production";
  const supabase = await createClient();

  const [{ data: buyers }, { data: logs }] = await Promise.all([
    supabase
      .from("buyers")
      .select("id, name, status, daily_count, daily_cap, weekly_count, weekly_cap, monthly_count, monthly_cap")
      .order("name", { ascending: true }),
    supabase
      .from("system_logs")
      .select("id, severity, event_type, message, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <PageHeader
        title="Dev Tools"
        description="Internal testing harness — create fake data, exercise the routing engine, and inspect the result."
      />

      {isProd ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Dev tools are disabled in production.
        </p>
      ) : (
        <DevToolsView buyers={buyers ?? []} initialLogs={logs ?? []} />
      )}
    </div>
  );
}
