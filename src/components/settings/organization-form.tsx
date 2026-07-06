"use client";

import { useFormState } from "react-dom";
import {
  updateOrganization,
  type SettingsFormState,
} from "@/lib/actions/settings";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: SettingsFormState = {};

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
];

export function OrganizationForm({
  name,
  timezone,
}: {
  name: string;
  timezone: string;
}) {
  const [state, formAction] = useFormState(updateOrganization, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Organization updated.
        </p>
      )}

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Organization name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="timezone"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={timezone}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton pendingText="Saving..." className="w-auto px-6">
        Save changes
      </SubmitButton>
    </form>
  );
}
