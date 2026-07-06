"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { clsx } from "clsx";
import { US_STATES, PRODUCT_TYPES } from "@/lib/us-states";
import {
  createRoutingRule,
  updateRoutingRule,
  type RoutingRuleFormValues,
} from "@/lib/actions/routing-rules";
import type { Database, LeadSourceType, RoutingStrategy } from "@/lib/types/database";

type RoutingRule = Database["public"]["Tables"]["routing_rules"]["Row"];
type Buyer = Database["public"]["Tables"]["buyers"]["Row"];

const STRATEGIES: { value: RoutingStrategy; label: string; hint: string }[] = [
  { value: "priority", label: "Priority order", hint: "Try buyers in priority order; first eligible buyer wins." },
  { value: "weighted", label: "Weighted", hint: "Distribute leads across buyers proportional to their weight." },
  { value: "round_robin", label: "Round robin", hint: "Rotate evenly through eligible buyers in turn." },
  { value: "ai_match", label: "AI match", hint: "Use intent score and buyer fit to pick the best match." },
];

const SOURCES: { value: LeadSourceType; label: string }[] = [
  { value: "quiz", label: "Quiz / Funnel" },
  { value: "webhook", label: "Webhook" },
  { value: "zapier", label: "Zapier" },
  { value: "meta_lead_ad", label: "Meta Lead Ads" },
  { value: "manual", label: "Manual" },
  { value: "api", label: "API" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

function defaultValues(): RoutingRuleFormValues {
  return {
    name: "",
    isActive: true,
    priority: 0,
    states: [],
    productTypes: [],
    minIntentScore: 0,
    maxIntentScore: 100,
    sources: [],
    strategy: "priority",
    buyerIds: [],
  };
}

function valuesFromRule(rule: RoutingRule, buyerIds: string[]): RoutingRuleFormValues {
  return {
    name: rule.name,
    isActive: rule.is_active,
    priority: rule.priority,
    states: rule.states,
    productTypes: rule.product_types,
    minIntentScore: rule.min_intent_score,
    maxIntentScore: rule.max_intent_score,
    sources: rule.sources,
    strategy: rule.strategy,
    buyerIds,
  };
}

export function RoutingRuleModal({
  open,
  onClose,
  rule,
  ruleBuyerIds,
  buyers,
}: {
  open: boolean;
  onClose: () => void;
  rule?: RoutingRule | null;
  ruleBuyerIds?: string[];
  buyers: Buyer[];
}) {
  const isEdit = Boolean(rule);
  const [values, setValues] = useState<RoutingRuleFormValues>(defaultValues());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(rule ? valuesFromRule(rule, ruleBuyerIds ?? []) : defaultValues());
      setError(null);
    }
  }, [open, rule, ruleBuyerIds]);

  if (!open) return null;

  function update<K extends keyof RoutingRuleFormValues>(key: K, value: RoutingRuleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleInArray<T>(key: "states" | "productTypes" | "sources" | "buyerIds", item: T) {
    setValues((v) => {
      const arr = v[key] as unknown as T[];
      return {
        ...v,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      } as RoutingRuleFormValues;
    });
  }

  async function handleSubmit() {
    if (!values.name.trim()) {
      setError("Rule name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = isEdit
      ? await updateRoutingRule(rule!.id, values)
      : await createRoutingRule(values);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? `Edit ${rule?.name}` : "New Routing Rule"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Rule name" required>
              <input
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
                placeholder="High-intent CA leads"
              />
            </Field>
            <Field label="Priority" hint="Lower number is evaluated first.">
              <input
                type="number"
                value={values.priority}
                onChange={(e) => update("priority", Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Routing strategy
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => update("strategy", s.value)}
                  className={clsx(
                    "rounded-lg border px-3 py-2 text-left text-sm transition",
                    values.strategy === s.value
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  <p className="font-medium">{s.label}</p>
                  <p className="mt-0.5 text-xs opacity-80">{s.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                States
              </label>
              {values.states.length > 0 && (
                <button
                  onClick={() => update("states", [])}
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Match all states
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {US_STATES.map((s) => (
                <button
                  key={s.code}
                  onClick={() => toggleInArray("states", s.code)}
                  className={clsx(
                    "rounded-lg border px-2 py-1.5 text-xs transition",
                    values.states.includes(s.code)
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {s.code}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Product types
            </label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TYPES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => toggleInArray("productTypes", p.value)}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    values.productTypes.includes(p.value)
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave empty to match all product types.</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Lead sources
            </label>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleInArray("sources", s.value)}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    values.sources.includes(s.value)
                      ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave empty to match all sources.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Min. intent score">
              <input
                type="number"
                min={0}
                max={100}
                value={values.minIntentScore}
                onChange={(e) => update("minIntentScore", Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
            <Field label="Max. intent score">
              <input
                type="number"
                min={0}
                max={100}
                value={values.maxIntentScore}
                onChange={(e) => update("maxIntentScore", Number(e.target.value) || 0)}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Eligible buyers
            </label>
            {buyers.length > 0 ? (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {buyers.map((b) => (
                  <label
                    key={b.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={values.buyerIds.includes(b.id)}
                      onChange={() => toggleInArray("buyerIds", b.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{b.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Add buyers first, then come back here to assign them to this rule.
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Leave empty to consider all active buyers that pass the filters above.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-900 dark:text-white">Active</span>
            <button
              onClick={() => update("isActive", !values.isActive)}
              className={clsx(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                values.isActive ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span
                className={clsx(
                  "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  values.isActive && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {submitting ? "Saving..." : "Save rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
