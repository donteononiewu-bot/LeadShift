"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signIn, type AuthFormState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = {};

export function LoginForm({ confirmEmail }: { confirmEmail: boolean }) {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Log in
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back to LeadShift.
        </p>
      </div>

      {confirmEmail && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          Check your email to confirm your account before logging in.
        </p>
      )}

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <SubmitButton pendingText="Logging in...">Log in</SubmitButton>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
