import { signOut } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";

export function Topbar({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string;
  role: string;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {fullName || email}
          </p>
          <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
            {role}
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            title="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
