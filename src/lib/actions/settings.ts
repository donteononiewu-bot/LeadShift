"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";

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
  const orgId = await getCurrentOrgId(supabase);

  if (!orgId) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name, timezone })
    .eq("id", orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
