import { Plug } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { IntegrationsView } from "@/components/integrations/integrations-view";

export default async function IntegrationsPage() {
  const supabase = await createClient();

  const [{ data: integrations }, { data: funnels }] = await Promise.all([
    supabase.from("integrations").select("*").order("created_at", { ascending: false }),
    supabase.from("funnels").select("*").order("name", { ascending: true }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // The Meta page access token is a real secret — never send its value to
  // the browser. Replace it with a boolean flag the editor uses to render
  // a "leave blank to keep existing" placeholder instead of the token.
  const sanitizedIntegrations = (integrations ?? []).map((integration) => {
    const config = { ...(integration.config as Record<string, unknown>) };
    if (typeof config.pageAccessToken !== "string") return integration;
    delete config.pageAccessToken;
    config.hasPageAccessToken = true;
    return { ...integration, config };
  });

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect the sources that send leads into your routing engine."
      />

      <IntegrationsView
        integrations={sanitizedIntegrations}
        funnels={funnels ?? []}
        appUrl={appUrl}
      />

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Plug className="mt-0.5 h-4 w-4 shrink-0" />
        Each integration gets its own ingest URL and secret key, optionally
        scoped to a specific funnel or campaign. Point Zapier, a webhook-
        capable source, or Meta Lead Ads at it, then map incoming fields to
        lead fields below.
      </div>
    </div>
  );
}
