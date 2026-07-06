"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { clsx } from "clsx";
import { US_STATES, PRODUCT_TYPES } from "@/lib/us-states";
import {
  createBuyer,
  updateBuyer,
  type BuyerFormValues,
} from "@/lib/actions/buyers";
import type { Database } from "@/lib/types/database";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];
type BuyerDeliveryMethod = Database["public"]["Tables"]["buyer_delivery_methods"]["Row"];

const STEPS = [
  "Buyer Info",
  "Accepted States",
  "Lead Caps",
  "Routing Settings",
  "Delivery Methods",
  "Booking Calendar",
  "Review & Activate",
] as const;

function defaultValues(): BuyerFormValues {
  return {
    name: "",
    email: "",
    phone: "",
    states: [],
    productTypes: [],
    minIntentScore: 0,
    pricePerLead: 0,
    dailyCap: null,
    weeklyCap: null,
    monthlyCap: null,
    weight: 1,
    priority: 0,
    bookingCalendarUrl: "",
    webhookUrl: "",
    zapierWebhookUrl: "",
    emailDeliveryEnabled: false,
    smsDeliveryEnabled: false,
    smsPhone: "",
    status: "active",
  };
}

function valuesFromBuyer(
  buyer: Buyer,
  deliveryMethods: BuyerDeliveryMethod[]
): BuyerFormValues {
  const email = deliveryMethods.find((m) => m.method === "email");
  const sms = deliveryMethods.find((m) => m.method === "sms");

  return {
    name: buyer.name,
    email: buyer.email ?? "",
    phone: buyer.phone ?? "",
    states: buyer.states,
    productTypes: buyer.product_types,
    minIntentScore: buyer.min_intent_score,
    pricePerLead: Number(buyer.price_per_lead),
    dailyCap: buyer.daily_cap,
    weeklyCap: buyer.weekly_cap,
    monthlyCap: buyer.monthly_cap,
    weight: buyer.weight,
    priority: buyer.priority,
    bookingCalendarUrl: buyer.booking_calendar_url ?? "",
    webhookUrl: buyer.webhook_url ?? "",
    zapierWebhookUrl: buyer.zapier_webhook_url ?? "",
    emailDeliveryEnabled: email?.is_active ?? false,
    smsDeliveryEnabled: sms?.is_active ?? false,
    smsPhone: (sms?.config.to as string) ?? "",
    status: buyer.status === "archived" ? "active" : buyer.status,
  };
}

export function BuyerModal({
  open,
  onClose,
  buyer,
  deliveryMethods,
}: {
  open: boolean;
  onClose: () => void;
  buyer?: Buyer | null;
  deliveryMethods?: BuyerDeliveryMethod[];
}) {
  const isEdit = Boolean(buyer);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<BuyerFormValues>(defaultValues());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(buyer ? valuesFromBuyer(buyer, deliveryMethods ?? []) : defaultValues());
      setStep(0);
      setError(null);
    }
  }, [open, buyer, deliveryMethods]);

  if (!open) return null;

  function update<K extends keyof BuyerFormValues>(key: K, value: BuyerFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleState(code: string) {
    setValues((v) => ({
      ...v,
      states: v.states.includes(code)
        ? v.states.filter((s) => s !== code)
        : [...v.states, code],
    }));
  }

  function toggleProductType(value: string) {
    setValues((v) => ({
      ...v,
      productTypes: v.productTypes.includes(value)
        ? v.productTypes.filter((p) => p !== value)
        : [...v.productTypes, value],
    }));
  }

  async function handleSubmit(activate: boolean) {
    setSubmitting(true);
    setError(null);
    const finalValues: BuyerFormValues = { ...values, status: activate ? "active" : "paused" };

    const result = isEdit
      ? await updateBuyer(buyer!.id, finalValues)
      : await createBuyer(finalValues);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  }

  const canGoNext = step === 0 ? values.name.trim().length > 0 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEdit ? `Edit ${buyer?.name}` : "Add Buyer"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 px-6 pt-4">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={clsx(
                "h-1.5 flex-1 rounded-full",
                i <= step ? "bg-brand-600" : "bg-slate-200 dark:bg-slate-800"
              )}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <Field label="Buyer name" required>
                <input
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputClass}
                  placeholder="Acme Insurance Group"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputClass}
                  placeholder="buyer@example.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass}
                  placeholder="(555) 123-4567"
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Leave empty to accept leads from any state.
                </p>
                {values.states.length > 0 && (
                  <button
                    onClick={() => update("states", [])}
                    className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Accept all states
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {US_STATES.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => toggleState(s.code)}
                    className={clsx(
                      "rounded-lg border px-3 py-2 text-left text-sm transition",
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
          )}

          {step === 2 && (
            <div className="space-y-4">
              <NumberField
                label="Daily lead cap"
                hint="Leave blank for unlimited."
                value={values.dailyCap}
                onChange={(v) => update("dailyCap", v)}
              />
              <NumberField
                label="Weekly lead cap"
                hint="Leave blank for unlimited."
                value={values.weeklyCap}
                onChange={(v) => update("weeklyCap", v)}
              />
              <NumberField
                label="Monthly lead cap"
                hint="Leave blank for unlimited."
                value={values.monthlyCap}
                onChange={(v) => update("monthlyCap", v)}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <NumberField
                label="Routing weight"
                hint="Higher weight = more leads in weighted routing."
                value={values.weight}
                onChange={(v) => update("weight", v ?? 1)}
              />
              <NumberField
                label="Priority"
                hint="Lower number = tried first in priority routing."
                value={values.priority}
                onChange={(v) => update("priority", v ?? 0)}
              />
              <NumberField
                label="Minimum intent score"
                hint="0-100. Leads scoring below this won't be routed here."
                value={values.minIntentScore}
                onChange={(v) => update("minIntentScore", v ?? 0)}
              />
              <NumberField
                label="Price per lead ($)"
                value={values.pricePerLead}
                onChange={(v) => update("pricePerLead", v ?? 0)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Accepted product types
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TYPES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => toggleProductType(p.value)}
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
                <p className="mt-1 text-xs text-slate-400">
                  Leave empty to accept all product types.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <Field label="Webhook URL">
                <input
                  value={values.webhookUrl}
                  onChange={(e) => update("webhookUrl", e.target.value)}
                  className={inputClass}
                  placeholder="https://buyer.com/webhook"
                />
              </Field>
              <Field label="Zapier webhook URL">
                <input
                  value={values.zapierWebhookUrl}
                  onChange={(e) => update("zapierWebhookUrl", e.target.value)}
                  className={inputClass}
                  placeholder="https://hooks.zapier.com/..."
                />
              </Field>
              <ToggleRow
                label="Email delivery"
                checked={values.emailDeliveryEnabled}
                onChange={(v) => update("emailDeliveryEnabled", v)}
                hint={values.email ? `Sends to ${values.email}` : "Add an email in Buyer Info first."}
              />
              <div>
                <ToggleRow
                  label="SMS delivery"
                  checked={values.smsDeliveryEnabled}
                  onChange={(v) => update("smsDeliveryEnabled", v)}
                />
                {values.smsDeliveryEnabled && (
                  <input
                    value={values.smsPhone}
                    onChange={(e) => update("smsPhone", e.target.value)}
                    className={clsx(inputClass, "mt-2")}
                    placeholder="SMS number, e.g. (555) 123-4567"
                  />
                )}
              </div>
              <p className="text-xs text-slate-400">
                Email and SMS delivery need a provider (Resend, Twilio, etc.)
                connected in Settings before they&apos;ll actually send.
              </p>
            </div>
          )}

          {step === 5 && (
            <Field
              label="Booking calendar URL"
              hint="Leads routed to this buyer redirect here immediately (e.g. a Calendly/Cal.com link)."
            >
              <input
                value={values.bookingCalendarUrl}
                onChange={(e) => update("bookingCalendarUrl", e.target.value)}
                className={inputClass}
                placeholder="https://cal.com/buyer-name"
              />
            </Field>
          )}

          {step === 6 && (
            <div className="space-y-4 text-sm">
              <ReviewRow label="Name" value={values.name} />
              <ReviewRow label="Contact" value={[values.email, values.phone].filter(Boolean).join(" · ") || "—"} />
              <ReviewRow
                label="States"
                value={values.states.length > 0 ? values.states.join(", ") : "All states"}
              />
              <ReviewRow
                label="Product types"
                value={values.productTypes.length > 0 ? values.productTypes.join(", ") : "All products"}
              />
              <ReviewRow
                label="Caps"
                value={`Daily ${values.dailyCap ?? "∞"} · Weekly ${values.weeklyCap ?? "∞"} · Monthly ${values.monthlyCap ?? "∞"}`}
              />
              <ReviewRow label="Weight / Priority" value={`${values.weight} / ${values.priority}`} />
              <ReviewRow label="Min. intent score" value={String(values.minIntentScore)} />
              <ReviewRow label="Booking URL" value={values.bookingCalendarUrl || "—"} />
              <ReviewRow
                label="Delivery"
                value={
                  [
                    values.webhookUrl && "Webhook",
                    values.zapierWebhookUrl && "Zapier",
                    values.emailDeliveryEnabled && "Email",
                    values.smsDeliveryEnabled && "SMS",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None configured"
                }
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-40 dark:text-slate-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canGoNext && setStep((s) => s + 1)}
              disabled={!canGoNext}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                Save as paused
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                {submitting ? "Saving..." : "Activate & Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

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

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={inputClass}
      />
    </Field>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
        )}
      >
        <span
          className={clsx(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
