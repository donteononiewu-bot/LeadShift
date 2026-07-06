import { clsx } from "clsx";

const TONES = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  green:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  brand:
    "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
} as const;

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}
