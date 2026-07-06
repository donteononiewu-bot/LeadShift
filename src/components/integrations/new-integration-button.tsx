"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createIntegration } from "@/lib/actions/integrations";
import type { Database, IntegrationType } from "@/lib/types/database";

type Funnel = Database["public"]["Tables"]["funnels"]["Row"];

const TYPE_OPTIONS: { value: IntegrationType; label: string }[] = [
  { value: "webhook", label: "Generic Webhook" },
  { value: "zapier", label: "Zapier" },
  { value: "meta_lead_ads", label: "Meta Lead Ads" },
  { value: "crm", label: "CRM" },
];

export function NewIntegrationButton({
  funnels,
  onCreated,
}: {
  funnels: Funnel[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<IntegrationType>("webhook");
  const [name, setName] = useState("");
  const [funnelId, setFunnelId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSubmitting(true);
    setError(null);
    const result = await createIntegration(type, name, funnelId);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setName("");
    onCreated();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        Add integration
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Add integration
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IntegrationType)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aged Leads Vendor"
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Target funnel/campaign (optional)
            </label>
            <select
              value={funnelId ?? ""}
              onChange={(e) => setFunnelId(e.target.value || null)}
              className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">No specific funnel</option>
              {funnels.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreate}
              disabled={submitting || !name.trim()}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
