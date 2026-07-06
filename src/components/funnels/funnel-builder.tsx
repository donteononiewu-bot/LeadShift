"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/badge";
import { FunnelPagesEditor } from "./funnel-pages-editor";
import { FunnelSettingsForm } from "./funnel-settings-form";
import { FunnelAnalytics, type FunnelAnalyticsData } from "./funnel-analytics";
import type { Database, FunnelQuestionType } from "@/lib/types/database";

type Funnel = Database["public"]["Tables"]["funnels"]["Row"];
type FunnelPage = Database["public"]["Tables"]["funnel_pages"]["Row"];
type FunnelQuestion = {
  id: string;
  funnel_page_id: string;
  question_text: string;
  question_type: FunnelQuestionType;
  options: { label: string; value: string; weight?: number }[];
  is_required: boolean;
  position: number;
  lead_field_mapping: string | null;
};

const TABS = ["Build", "Branding & Tracking", "Analytics"] as const;

export function FunnelBuilder({
  funnel,
  orgSlug,
  pages,
  questionsByPage,
  analytics,
}: {
  funnel: Funnel;
  orgSlug: string;
  pages: FunnelPage[];
  questionsByPage: Record<string, FunnelQuestion[]>;
  analytics: FunnelAnalyticsData;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Build");
  const liveUrl = `/f/${orgSlug}/${funnel.slug}`;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {funnel.name}
            </h1>
            <Badge tone={funnel.status === "published" ? "green" : "slate"}>
              {funnel.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {liveUrl}
          </p>
        </div>
        {funnel.status === "published" && (
          <Link
            href={liveUrl}
            target="_blank"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" />
            View live
          </Link>
        )}
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition",
              tab === t
                ? "border-brand-600 text-brand-700 dark:text-brand-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Build" && (
        <FunnelPagesEditor funnelId={funnel.id} pages={pages} questionsByPage={questionsByPage} />
      )}
      {tab === "Branding & Tracking" && <FunnelSettingsForm funnel={funnel} />}
      {tab === "Analytics" && <FunnelAnalytics data={analytics} />}
    </div>
  );
}
