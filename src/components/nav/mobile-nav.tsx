"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav-items";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
              isActive
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "text-slate-600 dark:text-slate-400"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
