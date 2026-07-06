"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { generateFunnel, createFunnelFromDraft } from "@/lib/actions/ai-funnel";
import type { GeneratedFunnel, GeneratedQuestion } from "@/lib/ai/funnel-generator";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function emptyQuestion(): GeneratedQuestion {
  return {
    questionText: "",
    questionType: "single_choice",
    options: [{ label: "", value: "", weight: 0, disqualifying: false }],
    leadFieldMapping: "",
    isRequired: true,
  };
}

export function AiFunnelBuilderForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<GeneratedFunnel | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const result = await generateFunnel(prompt);
    setGenerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDraft(result.draft ?? null);
  }

  async function handleCreate() {
    if (!draft) return;
    setCreating(true);
    setError(null);
    const result = await createFunnelFromDraft(prompt, draft);
    setCreating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/funnels/${result.funnelId}`);
  }

  function updateDraft<K extends keyof GeneratedFunnel>(key: K, value: GeneratedFunnel[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  function updateQuestion(index: number, updates: Partial<GeneratedQuestion>) {
    setDraft((d) => {
      if (!d) return d;
      const questions = d.questions.map((q, i) => (i === index ? { ...q, ...updates } : q));
      return { ...d, questions };
    });
  }

  function removeQuestion(index: number) {
    setDraft((d) => (d ? { ...d, questions: d.questions.filter((_, i) => i !== index) } : d));
  }

  function addQuestion() {
    setDraft((d) => (d ? { ...d, questions: [...d.questions, emptyQuestion()] } : d));
  }

  function updateOption(
    qIndex: number,
    oIndex: number,
    updates: Partial<GeneratedQuestion["options"][number]>
  ) {
    setDraft((d) => {
      if (!d) return d;
      const questions = d.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => (j === oIndex ? { ...o, ...updates } : o));
        return { ...q, options };
      });
      return { ...d, questions };
    });
  }

  function addOption(qIndex: number) {
    setDraft((d) => {
      if (!d) return d;
      const questions = d.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: [...q.options, { label: "", value: "", weight: 0, disqualifying: false }] }
          : q
      );
      return { ...d, questions };
    });
  }

  function removeOption(qIndex: number, oIndex: number) {
    setDraft((d) => {
      if (!d) return d;
      const questions = d.questions.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q
      );
      return { ...d, questions };
    });
  }

  if (!draft) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
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
          placeholder="e.g. Create an IUL qualification quiz for people interested in tax-free retirement income."
          className={inputClass}
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Generating..." : "Generate funnel"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Landing page
        </h3>
        <div className="space-y-3">
          <Field label="Funnel title">
            <input
              value={draft.title}
              onChange={(e) => updateDraft("title", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Headline">
            <input
              value={draft.landingHeadline}
              onChange={(e) => updateDraft("landingHeadline", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Subheadline">
            <input
              value={draft.landingSubheadline}
              onChange={(e) => updateDraft("landingSubheadline", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="CTA button text">
            <input
              value={draft.ctaText}
              onChange={(e) => updateDraft("ctaText", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Questions</h3>
          <button
            onClick={addQuestion}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Add question
          </button>
        </div>

        <div className="space-y-5">
          {draft.questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="mb-3 flex items-start gap-2">
                <input
                  value={question.questionText}
                  onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                  className={inputClass}
                  placeholder="Question text"
                />
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="mb-1 block text-slate-500">Maps to lead field</label>
                  <input
                    value={question.leadFieldMapping}
                    onChange={(e) =>
                      updateQuestion(qIndex, { leadFieldMapping: e.target.value })
                    }
                    placeholder="state, product_type, ..."
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={question.isRequired}
                      onChange={(e) => updateQuestion(qIndex, { isRequired: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
              </div>

              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">
                  Answer choices (weight, disqualifying)
                </label>
                <button
                  onClick={() => addOption(qIndex)}
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  + choice
                </button>
              </div>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      value={option.label}
                      onChange={(e) => updateOption(qIndex, oIndex, { label: e.target.value })}
                      placeholder="Label"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      value={option.weight}
                      onChange={(e) =>
                        updateOption(qIndex, oIndex, { weight: Number(e.target.value) || 0 })
                      }
                      className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={option.disqualifying}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, { disqualifying: e.target.checked })
                        }
                      />
                      DQ
                    </label>
                    <button
                      onClick={() => removeOption(qIndex, oIndex)}
                      className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Result & booking
        </h3>
        <div className="space-y-3">
          <Field label="Result headline">
            <input
              value={draft.resultHeadline}
              onChange={(e) => updateDraft("resultHeadline", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Result body">
            <textarea
              rows={3}
              value={draft.resultBody}
              onChange={(e) => updateDraft("resultBody", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Booking redirect message">
            <input
              value={draft.bookingRedirectMessage}
              onChange={(e) => updateDraft("bookingRedirectMessage", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDraft(null)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
        >
          Start over
        </button>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create funnel as draft"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
