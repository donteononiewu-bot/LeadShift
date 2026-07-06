import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
