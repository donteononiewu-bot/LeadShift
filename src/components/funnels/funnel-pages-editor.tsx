"use client";

import { useState, useTransition } from "react";
import {
  Home,
  HelpCircle,
  UserCheck,
  Trophy,
  CalendarCheck,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import {
  createFunnelPage,
  deleteFunnelPage,
  reorderFunnelPage,
  updateFunnelPage,
} from "@/lib/actions/funnels";
import { FunnelQuestionForm } from "./funnel-question-form";
import type { Database, FunnelPageType, FunnelQuestionType } from "@/lib/types/database";

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

const PAGE_TYPE_META: Record<FunnelPageType, { label: string; icon: typeof Home }> = {
  landing: { label: "Landing Page", icon: Home },
  question: { label: "Question", icon: HelpCircle },
  contact_info: { label: "Lead Capture Form", icon: UserCheck },
  result: { label: "Result Page", icon: Trophy },
  booking_redirect: { label: "Booking Redirect", icon: CalendarCheck },
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export function FunnelPagesEditor({
  funnelId,
  pages,
  questionsByPage,
}: {
  funnelId: string;
  pages: FunnelPage[];
  questionsByPage: Record<string, FunnelQuestion[]>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function addPage(type: FunnelPageType) {
    setActionError(null);
    startTransition(async () => {
      const result = await createFunnelPage(funnelId, type);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      if (result.id) setExpandedId(result.id);
    });
  }

  function move(pageId: string, direction: "up" | "down") {
    setActionError(null);
    startTransition(async () => {
      const result = await reorderFunnelPage(pageId, funnelId, direction);
      if (result.error) setActionError(result.error);
    });
  }

  function remove(pageId: string) {
    if (!confirm("Delete this page?")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteFunnelPage(pageId, funnelId);
      if (result.error) setActionError(result.error);
    });
  }

  return (
    <div>
      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(PAGE_TYPE_META) as FunnelPageType[]).map((type) => {
          const meta = PAGE_TYPE_META[type];
          const Icon = meta.icon;
          return (
            <button
              key={type}
              onClick={() => addPage(type)}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {pages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Add pages above to build your funnel: start with a landing page, add
          one or more questions, then a lead capture form, result page, and
          booking redirect.
        </p>
      ) : (
        <div className="space-y-3">
          {pages.map((page, index) => {
            const meta = PAGE_TYPE_META[page.page_type];
            const Icon = meta.icon;
            const expanded = expandedId === page.id;

            return (
              <div
                key={page.id}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </span>
                  <button
                    onClick={() => setExpandedId(expanded ? null : page.id)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {page.title || meta.label}
                    </p>
                    <p className="text-xs text-slate-400">{meta.label}</p>
                  </button>
                  <div className="flex items-center gap-1">
                    <IconBtn
                      icon={ChevronUp}
                      onClick={() => move(page.id, "up")}
                      disabled={index === 0 || isPending}
                    />
                    <IconBtn
                      icon={ChevronDown}
                      onClick={() => move(page.id, "down")}
                      disabled={index === pages.length - 1 || isPending}
                    />
                    <IconBtn
                      icon={Trash2}
                      onClick={() => remove(page.id)}
                      disabled={isPending}
                      danger
                    />
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                    <PageContentEditor funnelId={funnelId} page={page} />
                    {page.page_type === "question" && (
                      <FunnelQuestionForm
                        funnelId={funnelId}
                        pageId={page.id}
                        question={questionsByPage[page.id]?.[0] ?? null}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  icon: Icon,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof ChevronUp;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-lg p-1.5 transition disabled:opacity-30",
        danger
          ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PageContentEditor({ funnelId, page }: { funnelId: string; page: FunnelPage }) {
  const [title, setTitle] = useState(page.title ?? "");
  const [subtitle, setSubtitle] = useState(page.subtitle ?? "");
  const [content, setContent] = useState<Record<string, string>>(
    (page.content as Record<string, string>) ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await updateFunnelPage(page.id, funnelId, { title, subtitle, content });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Subtitle</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {page.page_type === "landing" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Call-to-action button text
          </label>
          <input
            value={content.ctaText ?? ""}
            onChange={(e) => setContent((c) => ({ ...c, ctaText: e.target.value }))}
            className={inputClass}
            placeholder="Get started"
          />
        </div>
      )}

      {page.page_type === "contact_info" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Intro text shown above the form
          </label>
          <textarea
            value={content.intro ?? ""}
            onChange={(e) => setContent((c) => ({ ...c, intro: e.target.value }))}
            className={inputClass}
            rows={2}
          />
        </div>
      )}

      {page.page_type === "result" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Result copy</label>
          <textarea
            value={content.body ?? ""}
            onChange={(e) => setContent((c) => ({ ...c, body: e.target.value }))}
            className={inputClass}
            rows={3}
          />
        </div>
      )}

      {page.page_type === "booking_redirect" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Redirect delay (seconds)
          </label>
          <input
            type="number"
            value={content.delaySeconds ?? "2"}
            onChange={(e) => setContent((c) => ({ ...c, delaySeconds: e.target.value }))}
            className={inputClass}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save page"}
        </button>
        {saved && <span className="text-xs text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </div>
  );
}
