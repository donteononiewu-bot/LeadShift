"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Webhook, Zap, Megaphone, Server, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewIntegrationButton } from "./new-integration-button";
import { IntegrationMappingEditor } from "./integration-mapping-editor";
import { deleteIntegration } from "@/lib/actions/integrations";
import type { Database, IntegrationType } from "@/lib/types/database";

type Integration = Database["public"]["Tables"]["integrations"]["Row"];
type Funnel = Database["public"]["Tables"]["funnels"]["Row"];

const TYPE_META: Record<IntegrationType, { label: string; icon: typeof Webhook; path: string }> = {
  webhook: { label: "Generic Webhook", icon: Webhook, path: "generic" },
  zapier: { label: "Zapier", icon: Zap, path: "zapier" },
  meta_lead_ads: { label: "Meta Lead Ads", icon: Megaphone, path: "meta" },
  crm: { label: "CRM", icon: Server, path: "generic" },
};

export function IntegrationsView({
  integrations,
  funnels,
  appUrl,
}: {
  integrations: Integration[];
  funnels: Funnel[];
  appUrl: string;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(integration: Integration) {
    if (!confirm(`Delete ${integration.name}?`)) return;
    startTransition(async () => {
      await deleteIntegration(integration.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <NewIntegrationButton funnels={funnels} onCreated={() => router.refresh()} />
      </div>

      {integrations.length > 0 ? (
        <div className="space-y-3">
          {integrations.map((integration) => {
            const meta = TYPE_META[integration.type];
            const Icon = meta.icon;
            const expanded = expandedId === integration.id;
            const funnel = funnels.find((f) => f.id === integration.funnel_id);

            return (
              <div
                key={integration.id}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </span>
                  <button
                    onClick={() => setExpandedId(expanded ? null : integration.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {integration.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {meta.label}
                      {funnel && ` · ${funnel.name}`}
                      {integration.last_event_at &&
                        ` · Last event ${new Date(integration.last_event_at).toLocaleString()}`}
                    </p>
                  </button>
                  <Badge
                    tone={
                      integration.status === "connected"
                        ? "green"
                        : integration.status === "error"
                        ? "red"
                        : "slate"
                    }
                  >
                    {integration.status}
                  </Badge>
                  <button
                    onClick={() => setExpandedId(expanded ? null : integration.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(integration)}
                    disabled={isPending}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {expanded && (
                  <div className="px-4 pb-4">
                    {integration.type !== "meta_lead_ads" && (
                      <div className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {appUrl}/api/webhooks/{meta.path}?key={integration.ingest_key}
                      </div>
                    )}
                    {integration.type === "meta_lead_ads" && (
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Register {appUrl}/api/webhooks/meta as your app&apos;s webhook
                        callback URL in the Meta developer dashboard, subscribe the
                        page to leadgen events, then fill in the page ID and
                        access token below.
                      </p>
                    )}
                    <IntegrationMappingEditor integration={integration} funnels={funnels} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No integrations yet. Add one to start accepting leads from webhooks,
          Zapier, or Meta Lead Ads.
        </p>
      )}
    </div>
  );
}
