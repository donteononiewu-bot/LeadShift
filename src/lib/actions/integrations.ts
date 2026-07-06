"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import type { IntegrationType } from "@/lib/types/database";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createIntegration(
  type: IntegrationType,
  name: string,
  funnelId: string | null
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("integrations")
    .insert({
      org_id: orgId,
      type,
      name: name.trim(),
      funnel_id: funnelId,
      status: "disconnected",
      config: { fieldMapping: {}, requiredFields: [] },
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create integration." };

  revalidatePath("/integrations");
  return { id: data.id };
}

export interface IntegrationMappingValues {
  name: string;
  funnelId: string | null;
  fieldMapping: Record<string, string>;
  requiredFields: string[];
  pageId?: string;
  pageAccessToken?: string;
}

export async function updateIntegration(
  integrationId: string,
  values: IntegrationMappingValues
): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const config: Record<string, unknown> = {
    fieldMapping: values.fieldMapping,
    requiredFields: values.requiredFields,
  };
  if (values.pageId !== undefined) config.pageId = values.pageId;
  if (values.pageAccessToken !== undefined) config.pageAccessToken = values.pageAccessToken;

  const { error } = await supabase
    .from("integrations")
    .update({
      name: values.name.trim(),
      funnel_id: values.funnelId,
      config,
    })
    .eq("id", integrationId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/integrations");
  return { id: integrationId };
}

export async function deleteIntegration(integrationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", integrationId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/integrations");
  return { id: integrationId };
}
