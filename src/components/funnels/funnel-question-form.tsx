"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import {
  createFunnelQuestion,
  updateFunnelQuestion,
  deleteFunnelQuestion,
  type FunnelQuestionValues,
} from "@/lib/actions/funnels";
import type { FunnelQuestionType } from "@/lib/types/database";

type QuestionOption = { label: string; value: string; weight?: number };
type Question = {
  id: string;
  question_text: string;
  question_type: FunnelQuestionType;
  options: QuestionOption[];
  is_required: boolean;
  lead_field_mapping: string | null;
};

const QUESTION_TYPES: { value: FunnelQuestionType; label: string; hasOptions: boolean }[] = [
  { value: "single_choice", label: "Single choice", hasOptions: true },
  { value: "multiple_choice", label: "Multiple choice", hasOptions: true },
  { value: "dropdown", label: "Dropdown", hasOptions: true },
  { value: "text", label: "Text", hasOptions: false },
  { value: "number", label: "Number", hasOptions: false },
  { value: "boolean", label: "Yes / No", hasOptions: false },
  { value: "slider", label: "Slider", hasOptions: false },
  { value: "date", label: "Date", hasOptions: false },
];

const LEAD_FIELD_OPTIONS = [
  { value: "", label: "Don't map to a lead field" },
  { value: "state", label: "State" },
  { value: "product_type", label: "Product type" },
  { value: "zip", label: "ZIP code" },
  { value: "date_of_birth", label: "Date of birth" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export function FunnelQuestionForm({
  funnelId,
  pageId,
  question,
}: {
  funnelId: string;
  pageId: string;
  question: Question | null;
}) {
  const [questionText, setQuestionText] = useState(question?.question_text ?? "");
  const [questionType, setQuestionType] = useState<FunnelQuestionType>(
    question?.question_type ?? "single_choice"
  );
  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options ?? [
      { label: "", value: "" },
      { label: "", value: "" },
    ]
  );
  const [isRequired, setIsRequired] = useState(question?.is_required ?? true);
  const [leadFieldMapping, setLeadFieldMapping] = useState(question?.lead_field_mapping ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const typeMeta = QUESTION_TYPES.find((t) => t.value === questionType)!;

  function updateOption(index: number, field: keyof QuestionOption, value: string) {
    setOptions((opts) =>
      opts.map((o, i) =>
        i === index
          ? { ...o, [field]: field === "weight" ? Number(value) || 0 : value }
          : o
      )
    );
  }

  function addOption() {
    setOptions((opts) => [...opts, { label: "", value: "" }]);
  }

  function removeOption(index: number) {
    setOptions((opts) => opts.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setError(null);

    const values: FunnelQuestionValues = {
      questionText,
      questionType,
      options: typeMeta.hasOptions
        ? options
            .filter((o) => o.label.trim())
            .map((o) => ({ ...o, value: o.value.trim() || o.label.trim().toLowerCase().replace(/\s+/g, "_") }))
        : [],
      isRequired,
      leadFieldMapping,
    };

    const result = question
      ? await updateFunnelQuestion(question.id, funnelId, values)
      : await createFunnelQuestion(pageId, funnelId, values);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!question) return;
    if (!confirm("Delete this question?")) return;
    setDeleting(true);
    setError(null);
    const result = await deleteFunnelQuestion(question.id, funnelId);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Question text</label>
        <input
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className={inputClass}
          placeholder="What's your annual household income?"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Answer type</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as FunnelQuestionType)}
            className={inputClass}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Maps to lead field
          </label>
          <select
            value={leadFieldMapping}
            onChange={(e) => setLeadFieldMapping(e.target.value)}
            className={inputClass}
          >
            {LEAD_FIELD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {typeMeta.hasOptions && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-500">
              Answer choices (weight adjusts intent score)
            </label>
            <button
              onClick={addOption}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              <Plus className="h-3 w-3" />
              Add choice
            </button>
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={opt.label}
                  onChange={(e) => updateOption(i, "label", e.target.value)}
                  placeholder="Label shown to visitor"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={opt.weight ?? 0}
                  onChange={(e) => updateOption(i, "weight", e.target.value)}
                  placeholder="Weight"
                  className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={() => removeOption(i)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
        Required
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !questionText.trim()}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : question ? "Update question" : "Create question"}
        </button>
        {question && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete question"}
          </button>
        )}
        {saved && <span className="text-xs text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </div>
  );
}
