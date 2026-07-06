"use client";

import { X } from "lucide-react";
import { clsx } from "clsx";
import type { Database, RoutingOutcome } from "@/lib/types/database";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];

export interface RoutingEventSummary {
  outcome: RoutingOutcome;
  explanation: string | null;
  created_at: string;
}

const OUTCOME_TONE: Record<RoutingOutcome, string> = {
  accepted: "text-green-600 dark:text-green-400",
  delivery_success: "text-green-600 dark:text-green-400",
  delivery_failed: "text-red-600 dark:text-red-400",
  rejected_cap: "text-amber-600 dark:text-amber-400",
  rejected_state: "text-slate-500 dark:text-slate-400",
  rejected_score: "text-slate-500 dark:text-slate-400",
  rejected_availability: "text-slate-500 dark:text-slate-400",
  rejected_paused: "text-slate-500 dark:text-slate-400",
  no_buyers_matched: "text-red-600 dark:text-red-400",
};

function CapBar({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{cap === null ? `${used} / unlimited` : `${used} / ${cap}`}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={clsx(
            "h-full rounded-full",
            pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-brand-600"
          )}
          style={{ width: cap === null ? "0%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function BuyerStatsDrawer({
  open,
  onClose,
  buyer,
  totalRouted,
  recentEvents,
}: {
  open: boolean;
  onClose: () => void;
  buyer: Buyer | null;
  totalRouted: number;
  recentEvents: RoutingEventSummary[];
}) {
  if (!open || !buyer) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {buyer.name} stats
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total routed</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">
                {totalRouted}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Priority / weight</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">
                {buyer.priority} / {buyer.weight}
              </p>
            </div>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Cap usage
          </h3>
          <div className="mb-6 space-y-3">
            <CapBar label="Daily" used={buyer.daily_count} cap={buyer.daily_cap} />
            <CapBar label="Weekly" used={buyer.weekly_count} cap={buyer.weekly_cap} />
            <CapBar label="Monthly" used={buyer.monthly_count} cap={buyer.monthly_cap} />
          </div>

          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
            Recent routing decisions
          </h3>
          {recentEvents.length > 0 ? (
            <ul className="space-y-3">
              {recentEvents.map((event, i) => (
                <li key={i} className="border-b border-slate-100 pb-3 text-sm dark:border-slate-800">
                  <p className={clsx("font-medium", OUTCOME_TONE[event.outcome])}>
                    {event.outcome.replace(/_/g, " ")}
                  </p>
                  {event.explanation && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {event.explanation}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">No routing decisions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
