"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import type { IntegrationType } from "@/lib/types/database";

export interface ActionResult {
  error?: string;
  id?: string;
}

/** Confirms a funnel id (if provided) actually belongs to this org before it's stored as a foreign reference. */
async function assertFunnelInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  funnelId: string | null
): Promise<boolean> {
  if (!funnelId) return true;
  const { data } = await supabase
    .from("funnels")
    .select("id")
    .eq("id", funnelId)
    .eq("org_id", orgId)
    .maybeSingle();
  return Boolean(data);
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

  if (!(await assertFunnelInOrg(supabase, orgId, funnelId))) {
    return { error: "That funnel doesn't belong to your organization." };
  }

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

  if (!(await assertFunnelInOrg(supabase, orgId, values.funnelId))) {
    return { error: "That funnel doesn't belong to your organization." };
  }

  const { data: existing } = await supabase
    .from("integrations")
    .select("config")
    .eq("id", integrationId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!existing) return { error: "Integration not found." };

  const existingConfig = existing.config as Record<string, unknown>;
  const config: Record<string, unknown> = {
    fieldMapping: values.fieldMapping,
    requiredFields: values.requiredFields,
  };
  if (values.pageId !== undefined) config.pageId = values.pageId;
  // Only overwrite the stored access token when the caller actually sent a
  // new one — a blank field means "leave the existing secret alone".
  if (values.pageAccessToken) {
    config.pageAccessToken = values.pageAccessToken;
  } else if (typeof existingConfig.pageAccessToken === "string") {
    config.pageAccessToken = existingConfig.pageAccessToken;
  }

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

  const { data, error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", integrationId)
    .eq("org_id", orgId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Integration not found or already deleted." };

  revalidatePath("/integrations");
  return { id: integrationId };
}
