import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { OrganizationForm } from "@/components/settings/organization-form";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, organizations(name, timezone)")
    .eq("id", user.id)
    .single();

  const org = profile?.organizations as unknown as
    | { name: string; timezone: string }
    | null;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your organization and account details."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Organization
          </h2>
          <OrganizationForm
            name={org?.name ?? ""}
            timezone={org?.timezone ?? "America/New_York"}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Your account
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Name</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {profile?.full_name || "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {profile?.email}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Role</dt>
              <dd>
                <Badge tone="brand">{profile?.role}</Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
