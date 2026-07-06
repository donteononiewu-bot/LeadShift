"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav-items";

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="flex h-16 items-center border-b border-slate-200 px-5 dark:border-slate-800">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          LeadShift
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        {orgName}
      </div>
    </aside>
  );
}
