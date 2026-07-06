import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-brand-50 px-6 text-center dark:from-slate-950 dark:to-slate-900">
      <span className="mb-4 rounded-full bg-brand-100 px-4 py-1 text-sm font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
        Life Insurance & IUL Lead Routing
      </span>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
        Route every lead to the right buyer in under 2 seconds
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
        Capture leads from quizzes, webhooks, Zapier, and Meta Lead Ads, then
        distribute them automatically by state, cap, availability, and intent
        score.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-700"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
