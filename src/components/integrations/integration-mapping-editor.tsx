"use client";

import { useState } from "react";
import { updateIntegration } from "@/lib/actions/integrations";
import { LEAD_FIELDS, type LeadField } from "@/lib/intake/field-mapping";
import type { Database } from "@/lib/types/database";

type Integration = Database["public"]["Tables"]["integrations"]["Row"];
type Funnel = Database["public"]["Tables"]["funnels"]["Row"];

const FIELD_LABELS: Record<LeadField, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  state: "State",
  zip: "ZIP",
  productType: "Product type",
  dateOfBirth: "Date of birth",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export function IntegrationMappingEditor({
  integration,
  funnels,
}: {
  integration: Integration;
  funnels: Funnel[];
}) {
  const config = integration.config as {
    fieldMapping?: Record<string, string>;
    requiredFields?: string[];
    pageId?: string;
    pageAccessToken?: string;
  };

  const [name, setName] = useState(integration.name);
  const [funnelId, setFunnelId] = useState<string | null>(integration.funnel_id);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>(
    config.fieldMapping ?? {}
  );
  const [requiredFieldsText, setRequiredFieldsText] = useState(
    (config.requiredFields ?? []).join(", ")
  );
  const [pageId, setPageId] = useState(config.pageId ?? "");
  const [pageAccessToken, setPageAccessToken] = useState(config.pageAccessToken ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const result = await updateIntegration(integration.id, {
      name,
      funnelId,
      fieldMapping,
      requiredFields: requiredFieldsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ...(integration.type === "meta_lead_ads" ? { pageId, pageAccessToken } : {}),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Target funnel/campaign (optional)
          </label>
          <select
            value={funnelId ?? ""}
            onChange={(e) => setFunnelId(e.target.value || null)}
            className={inputClass}
          >
            <option value="">No specific funnel</option>
            {funnels.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {integration.type === "meta_lead_ads" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Facebook Page ID
            </label>
            <input value={pageId} onChange={(e) => setPageId(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Page access token
            </label>
            <input
              type="password"
              value={pageAccessToken}
              onChange={(e) => setPageAccessToken(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-medium text-slate-500">
          Field mapping — incoming JSON path for each lead field
        </label>
        <div className="space-y-2">
          {LEAD_FIELDS.map((field) => (
            <div key={field} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-xs text-slate-500">{FIELD_LABELS[field]}</span>
              <input
                value={fieldMapping[field] ?? ""}
                onChange={(e) =>
                  setFieldMapping((m) => ({ ...m, [field]: e.target.value }))
                }
                placeholder={
                  integration.type === "meta_lead_ads" ? "email" : "e.g. contact.email"
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Required incoming fields (comma-separated paths, request rejected if missing)
        </label>
        <input
          value={requiredFieldsText}
          onChange={(e) => setRequiredFieldsText(e.target.value)}
          placeholder="email, phone"
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save mapping"}
        </button>
        {saved && <span className="text-xs text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </div>
  );
}
