import { Plug, Webhook, Zap, Megaphone, Server } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";

const TYPE_META = {
  zapier: { label: "Zapier", icon: Zap },
  meta_lead_ads: { label: "Meta Lead Ads", icon: Megaphone },
  webhook: { label: "Generic Webhook", icon: Webhook },
  crm: { label: "CRM", icon: Server },
} as const;

export default async function IntegrationsPage() {
  const supabase = await createClient();

  const { data: integrations } = await supabase
    .from("integrations")
    .select("id, type, name, status, ingest_key, last_event_at, last_error")
    .order("created_at", { ascending: false });

  const byType = new Map((integrations ?? []).map((i) => [i.type, i]));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect the sources that send leads into your routing engine."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const integration = byType.get(type);

          return (
            <div
              key={type}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {meta.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {integration?.last_event_at
                        ? `Last event ${new Date(integration.last_event_at).toLocaleString()}`
                        : "No events yet"}
                    </p>
                  </div>
                </div>
                <Badge
                  tone={
                    integration?.status === "connected"
                      ? "green"
                      : integration?.status === "error"
                      ? "red"
                      : "slate"
                  }
                >
                  {integration?.status ?? "disconnected"}
                </Badge>
              </div>

              {integration ? (
                <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {appUrl}/api/webhooks/{type === "meta_lead_ads" ? "meta" : type}?key=
                  {integration.ingest_key}
                </div>
              ) : (
                <button className="mt-4 w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">
                  Connect {meta.label}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Plug className="mt-0.5 h-4 w-4 shrink-0" />
        Each integration gets a unique ingest URL with a secret key. Point
        Zapier, Meta Lead Ads, or any webhook-capable source at that URL to
        start capturing leads.
      </div>
    </div>
  );
}
