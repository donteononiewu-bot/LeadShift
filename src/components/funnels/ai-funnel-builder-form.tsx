"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function AiFunnelBuilderForm() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <label
        htmlFor="prompt"
        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Describe the funnel you want
      </label>
      <textarea
        id="prompt"
        rows={6}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. A 5-question IUL quiz for homeowners aged 45-65 that qualifies on coverage amount, health, and budget before asking for contact info."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />

      <button
        type="button"
        disabled
        title="AI generation is wired up in a follow-up step"
        className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white opacity-60 transition disabled:cursor-not-allowed"
      >
        <Sparkles className="h-4 w-4" />
        Generate funnel
      </button>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Generation isn&apos;t connected yet — this screen is ready for the AI
        builder API to plug into.
      </p>
    </div>
  );
}
