"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SettingsFormState {
  error?: string;
  success?: boolean;
}

export async function updateOrganization(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!name) {
    return { error: "Organization name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name, timezone })
    .eq("id", profile.org_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
