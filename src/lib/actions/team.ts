"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/org";
import type { UserRole } from "@/lib/types/database";

export interface TeamActionResult {
  error?: string;
}

interface CallerContext {
  orgId: string;
  userId: string;
}

/** Confirms the caller is signed in and an owner/admin of their org — the only roles allowed to manage team members. */
async function assertCanManageTeam(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CallerContext | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { data: caller } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (caller?.role !== "owner" && caller?.role !== "admin") {
    return { error: "Only owners and admins can manage team members." };
  }

  return { orgId, userId: user.id };
}

export async function inviteTeamMember(email: string, role: UserRole): Promise<TeamActionResult> {
  if (!email.trim()) return { error: "Email is required." };

  const supabase = await createClient();
  const auth = await assertCanManageTeam(supabase);
  if ("error" in auth) return auth;

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", auth.orgId)
    .single();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { invited_org_id: auth.orgId, invited_role: role, org_name: org?.name },
  });

  if (error) return { error: error.message };

  revalidatePath("/team");
  return {};
}

export async function updateTeamMemberRole(userId: string, role: UserRole): Promise<TeamActionResult> {
  const supabase = await createClient();
  const auth = await assertCanManageTeam(supabase);
  if ("error" in auth) return auth;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("id, org_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!target || target.org_id !== auth.orgId) return { error: "Member not found." };

  if (target.role === "owner" && role !== "owner") {
    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("org_id", auth.orgId)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) return { error: "Every org needs at least one owner." };
  }

  const { error } = await admin
    .from("users")
    .update({ role })
    .eq("id", userId)
    .eq("org_id", auth.orgId);

  if (error) return { error: error.message };

  revalidatePath("/team");
  return {};
}

export async function removeTeamMember(userId: string): Promise<TeamActionResult> {
  const supabase = await createClient();
  const auth = await assertCanManageTeam(supabase);
  if ("error" in auth) return auth;

  if (userId === auth.userId) return { error: "You can't remove yourself from the team." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("id, org_id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!target || target.org_id !== auth.orgId) return { error: "Member not found." };

  if (target.role === "owner") {
    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("org_id", auth.orgId)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) return { error: "Every org needs at least one owner." };
  }

  // Deleting the auth user cascades to their `users` row
  // (users.id references auth.users(id) on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/team");
  return {};
}
