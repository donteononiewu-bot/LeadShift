"use client";

import { useState } from "react";
import { updateFunnelSettings } from "@/lib/actions/funnels";
import type { Database, FunnelStatus } from "@/lib/types/database";

type Funnel = Database["public"]["Tables"]["funnels"]["Row"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export function FunnelSettingsForm({ funnel }: { funnel: Funnel }) {
  const [name, setName] = useState(funnel.name);
  const [slug, setSlug] = useState(funnel.slug);
  const [status, setStatus] = useState<FunnelStatus>(funnel.status);
  const [primaryColor, setPrimaryColor] = useState(funnel.primary_color);
  const [logoUrl, setLogoUrl] = useState(funnel.logo_url ?? "");
  const [faviconUrl, setFaviconUrl] = useState(funnel.favicon_url ?? "");
  const [metaPixelId, setMetaPixelId] = useState(funnel.meta_pixel_id ?? "");
  const [customHeadScript, setCustomHeadScript] = useState(funnel.custom_head_script ?? "");
  const [customBodyScript, setCustomBodyScript] = useState(funnel.custom_body_script ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const result = await updateFunnelSettings(funnel.id, {
      name,
      slug,
      status,
      primaryColor,
      logoUrl,
      faviconUrl,
      metaPixelId,
      customHeadScript,
      customBodyScript,
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
    <div className="max-w-2xl space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Name
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Slug
            </label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FunnelStatus)}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Branding</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Primary color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-14 rounded border border-slate-300 dark:border-slate-700"
              />
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Logo URL
            </label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Favicon URL
            </label>
            <input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Tracking</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Meta Pixel ID
            </label>
            <input
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="123456789012345"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Fires PageView, Lead, CompleteRegistration, and Schedule events
              automatically as visitors move through this funnel.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Custom head script
            </label>
            <textarea
              value={customHeadScript}
              onChange={(e) => setCustomHeadScript(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="<script>...</script>"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Custom body script
            </label>
            <textarea
              value={customBodyScript}
              onChange={(e) => setCustomBodyScript(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="<script>...</script>"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </div>
  );
}
