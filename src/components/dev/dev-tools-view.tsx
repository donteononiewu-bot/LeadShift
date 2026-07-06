"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Users, Building2, RotateCcw, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  createFakeBuyers,
  createFakeLeads,
  runFakeQuizSubmission,
  resetTestData,
  type RunEngineInput,
  type RunEngineResult,
} from "@/lib/actions/dev-tools";
import type { RoutingOutcome, SystemLogSeverity } from "@/lib/types/database";

interface BuyerCapRow {
  id: string;
  name: string;
  status: string;
  daily_count: number;
  daily_cap: number | null;
  weekly_count: number;
  weekly_cap: number | null;
  monthly_count: number;
  monthly_cap: number | null;
}

interface LogRow {
  id: string;
  severity: SystemLogSeverity;
  event_type: string;
  message: string;
  created_at: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const OUTCOME_TONE: Record<RoutingOutcome, "green" | "red" | "amber" | "slate"> = {
  accepted: "green",
  delivery_success: "green",
  delivery_failed: "red",
  rejected_cap: "amber",
  rejected_state: "slate",
  rejected_score: "slate",
  rejected_availability: "slate",
  rejected_paused: "slate",
  no_buyers_matched: "red",
  not_selected: "slate",
};

export function DevToolsView({
  buyers,
  initialLogs,
}: {
  buyers: BuyerCapRow[];
  initialLogs: LogRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [buyerCount, setBuyerCount] = useState(3);
  const [leadCount, setLeadCount] = useState(5);
  const [quizInput, setQuizInput] = useState<RunEngineInput>({
    state: "TX",
    productType: "iul",
    intentLevel: "high",
  });
  const [runResult, setRunResult] = useState<RunEngineResult | null>(null);

  function handleCreateBuyers() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await createFakeBuyers(buyerCount);
      if (res.error) setError(res.error);
      else setMessage(`Created ${res.count} fake buyer(s).`);
      router.refresh();
    });
  }

  function handleCreateLeads() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await createFakeLeads(leadCount);
      if (res.error) setError(res.error);
      else setMessage(`Created ${res.count} fake lead(s).`);
      router.refresh();
    });
  }

  function handleRunEngine() {
    setError(null);
    setMessage(null);
    setRunResult(null);
    startTransition(async () => {
      const res = await runFakeQuizSubmission(quizInput);
      if (res.error) setError(res.error);
      else setRunResult(res);
      router.refresh();
    });
  }

  function handleReset() {
    if (!confirm("Delete all [TEST]-tagged buyers and dev-test leads? This can't be undone.")) {
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await resetTestData();
      if (res.error) setError(res.error);
      else setMessage("Test data reset.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            error
              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          }`}
        >
          {error ?? message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Building2 className="h-4 w-4" />
            Create fake buyers
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={20}
              value={buyerCount}
              onChange={(e) => setBuyerCount(Number(e.target.value) || 1)}
              className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={handleCreateBuyers}
              disabled={isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Random states, caps, weight, and priority. Named with a [TEST] prefix.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Users className="h-4 w-4" />
            Create fake leads (unrouted)
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={50}
              value={leadCount}
              onChange={(e) => setLeadCount(Number(e.target.value) || 1)}
              className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={handleCreateLeads}
              disabled={isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Inserted directly with status &apos;new&apos; — does not run the routing engine.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <PlayCircle className="h-4 w-4" />
          Submit a fake quiz &amp; run the routing engine
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">State</label>
            <input
              value={quizInput.state}
              onChange={(e) => setQuizInput((q) => ({ ...q, state: e.target.value.toUpperCase() }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Product type</label>
            <input
              value={quizInput.productType}
              onChange={(e) => setQuizInput((q) => ({ ...q, productType: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Intent level</label>
            <select
              value={quizInput.intentLevel}
              onChange={(e) =>
                setQuizInput((q) => ({
                  ...q,
                  intentLevel: e.target.value as RunEngineInput["intentLevel"],
                }))
              }
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRunEngine}
          disabled={isPending}
          className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {isPending ? "Running..." : "Submit & route"}
        </button>

        {runResult?.result && (
          <div className="mt-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Stat label="Status" value={runResult.result.status} />
              <Stat label="Intent score" value={String(runResult.result.intentScore)} />
              <Stat label="Duration" value={`${runResult.result.routingDurationMs}ms`} />
              <Stat
                label="Booking URL"
                value={runResult.result.bookingCalendarUrl ? "Yes" : "None"}
              />
            </div>

            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Why this buyer was selected
            </h4>
            {runResult.events && runResult.events.length > 0 ? (
              <ul className="space-y-2">
                {runResult.events.map((event, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge tone={OUTCOME_TONE[event.outcome]}>{event.outcome.replace(/_/g, " ")}</Badge>
                    <span className="text-slate-600 dark:text-slate-400">
                      {event.buyerName ? `${event.buyerName}: ` : ""}
                      {event.explanation}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No routing events recorded.</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Buyer caps</h3>
        {buyers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Buyer</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Daily</th>
                  <th className="pb-2 font-medium">Weekly</th>
                  <th className="pb-2 font-medium">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {buyers.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2 text-slate-900 dark:text-white">{b.name}</td>
                    <td className="py-2">
                      <Badge tone={b.status === "active" ? "green" : "slate"}>{b.status}</Badge>
                    </td>
                    <td className="py-2">{b.daily_count} / {b.daily_cap ?? "∞"}</td>
                    <td className="py-2">{b.weekly_count} / {b.weekly_cap ?? "∞"}</td>
                    <td className="py-2">{b.monthly_count} / {b.monthly_cap ?? "∞"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No buyers yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Recent routing logs
        </h3>
        {initialLogs.length > 0 ? (
          <ul className="space-y-2">
            {initialLogs.map((log) => (
              <li key={log.id} className="text-sm">
                <span className="font-mono text-xs text-slate-400">{log.event_type}</span>{" "}
                <span className="text-slate-700 dark:text-slate-300">{log.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No log entries yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
          <RotateCcw className="h-4 w-4" />
          Reset test data
        </h3>
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">
          Deletes all [TEST]-tagged buyers and dev-test leads (and their routing events) for
          this org. Real data is untouched.
        </p>
        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-medium capitalize text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
