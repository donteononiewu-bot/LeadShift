import { Users, Play, CheckCircle2, UserPlus, Zap, CalendarCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

export interface FunnelAnalyticsData {
  visitors: number;
  starts: number;
  completions: number;
  leads: number;
  routedLeads: number;
  bookingRedirects: number;
  dropOff: { id: string; text: string; answered: number }[];
  sourcePerformance: { source: string; total: number; routed: number }[];
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function FunnelAnalytics({ data }: { data: FunnelAnalyticsData }) {
  const maxAnswered = Math.max(data.starts, 1, ...data.dropOff.map((d) => d.answered));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Visitors" value={String(data.visitors)} icon={Users} />
        <StatCard label="Quiz starts" value={String(data.starts)} icon={Play} />
        <StatCard
          label="Completions"
          value={String(data.completions)}
          icon={CheckCircle2}
          hint={`${pct(data.completions, data.starts)} of starts`}
        />
        <StatCard label="Leads" value={String(data.leads)} icon={UserPlus} />
        <StatCard
          label="Routed leads"
          value={String(data.routedLeads)}
          icon={Zap}
          hint={`${pct(data.routedLeads, data.leads)} of leads`}
        />
        <StatCard
          label="Booking redirects"
          value={String(data.bookingRedirects)}
          icon={CalendarCheck}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Drop-off by question
        </h3>
        {data.dropOff.length > 0 ? (
          <div className="space-y-3">
            <DropOffBar label="Started quiz" value={data.starts} max={maxAnswered} />
            {data.dropOff.map((q) => (
              <DropOffBar key={q.id} label={q.text} value={q.answered} max={maxAnswered} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Add questions to see drop-off data.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Source performance
        </h3>
        {data.sourcePerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Leads</th>
                  <th className="pb-2 font-medium">Routed</th>
                  <th className="pb-2 font-medium">Routed %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.sourcePerformance.map((s) => (
                  <tr key={s.source}>
                    <td className="py-2 capitalize text-slate-900 dark:text-white">
                      {s.source.replace(/_/g, " ")}
                    </td>
                    <td className="py-2">{s.total}</td>
                    <td className="py-2">{s.routed}</td>
                    <td className="py-2">{pct(s.routed, s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No leads yet.</p>
        )}
      </div>
    </div>
  );
}

function DropOffBar({ label, value, max }: { label: string; value: number; max: number }) {
  const widthPct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium text-slate-900 dark:text-white">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-brand-600"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
