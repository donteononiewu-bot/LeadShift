import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { routeLead } from "@/lib/routing/engine";
import { logSystemEvent } from "@/lib/routing/logging";
import { applyFieldMapping, findMissingFields, type IntegrationConfig } from "./field-mapping";
import type { LeadSourceType } from "@/lib/types/database";

export interface IntakeResult {
  status: number;
  body: Record<string, unknown>;
}

/**
 * Shared by every external intake route (generic webhook, Zapier, Meta Lead
 * Ads): look up the integration by its ingest key, validate the configured
 * required fields are present, map the payload onto lead fields, and hand
 * off to the routing engine. This is the one code path all of them funnel
 * through so field-mapping and validation behavior stays consistent.
 */
export async function handleExternalIntake(params: {
  ingestKey: string | null;
  source: LeadSourceType;
  payload: Record<string, unknown>;
}): Promise<IntakeResult> {
  if (!params.ingestKey) {
    return { status: 400, body: { error: "Missing ?key= ingest key." } };
  }

  const admin = createAdminClient();
  const { data: integration } = await admin
    .from("integrations")
    .select("*")
    .eq("ingest_key", params.ingestKey)
    .maybeSingle();

  if (!integration) {
    return { status: 404, body: { error: "Unknown ingest key." } };
  }

  const config = integration.config as IntegrationConfig;
  const requiredFields = config.requiredFields ?? [];
  const fieldMapping = config.fieldMapping ?? {};

  const missing = findMissingFields(params.payload, requiredFields);
  if (missing.length > 0) {
    await admin
      .from("integrations")
      .update({ status: "error", last_error: `Missing required fields: ${missing.join(", ")}` })
      .eq("id", integration.id);

    await logSystemEvent(admin, {
      orgId: integration.org_id,
      severity: "error",
      entityType: "integration",
      entityId: integration.id,
      eventType: "integration.validation_failed",
      message: `${integration.name}: missing required fields ${missing.join(", ")}.`,
    });

    return { status: 400, body: { error: "Missing required fields.", missing } };
  }

  const mapped = applyFieldMapping(params.payload, fieldMapping);

  const result = await routeLead({
    orgId: integration.org_id,
    source: params.source,
    funnelId: integration.funnel_id,
    name: mapped.name,
    email: mapped.email,
    phone: mapped.phone,
    state: mapped.state,
    zip: mapped.zip,
    productType: mapped.productType,
    dateOfBirth: mapped.dateOfBirth,
    rawPayload: params.payload,
  });

  await admin
    .from("integrations")
    .update({
      status: "connected",
      last_event_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", integration.id);

  return { status: 200, body: { ...result } };
}
