import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import { PageHeader } from "@/components/dashboard/page-header";
import { TeamView } from "@/components/team/team-view";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const orgId = await getCurrentOrgId(supabase);

  const { data: members } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at")
    .eq("org_id", orgId ?? "")
    .order("created_at", { ascending: true });

  const currentMember = (members ?? []).find((m) => m.id === user?.id);
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  return (
    <div>
      <PageHeader
        title="Team"
        description="Who has access to this organization."
      />
      <TeamView
        members={members ?? []}
        currentUserId={user?.id ?? ""}
        canManage={canManage}
      />
    </div>
  );
}
