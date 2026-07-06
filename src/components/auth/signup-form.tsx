"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { signUp, type AuthFormState } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Start routing leads in minutes.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="org_name"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Company name
        </label>
        <input
          id="org_name"
          name="org_name"
          type="text"
          required
          placeholder="Acme Insurance Group"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="full_name"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

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
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <SubmitButton pendingText="Creating account...">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
