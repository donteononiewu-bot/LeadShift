import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routeLead } from "@/lib/routing/engine";
import { logSystemEvent } from "@/lib/routing/logging";
import { applyFieldMapping, findMissingFields, type IntegrationConfig } from "@/lib/intake/field-mapping";

/**
 * Meta's one-time webhook subscription handshake: it GETs this URL with
 * hub.mode=subscribe and expects the raw hub.challenge value echoed back
 * if hub.verify_token matches what you configured in the Meta App dashboard.
 * This is app-wide (one callback URL per app), unlike the per-integration
 * ingest keys the other webhook routes use.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

interface MetaLeadgenChange {
  field: string;
  value: {
    leadgen_id: string;
    page_id: string;
    form_id: string;
  };
}

interface MetaWebhookPayload {
  entry?: Array<{ id: string; changes?: MetaLeadgenChange[] }>;
}

/**
 * Meta signs every POST with an HMAC-SHA256 of the raw body, keyed by the
 * app secret, in the X-Hub-Signature-256 header. Without checking this,
 * anyone who can guess/enumerate a customer's public Facebook Page ID can
 * forge a leadgen notification and get it routed (and burn the org's
 * Graph API access token) with no authentication at all.
 */
function isValidMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}

async function fetchLeadFieldData(
  leadgenId: string,
  pageAccessToken: string
): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(pageAccessToken)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      field_data?: Array<{ name: string; values: string[] }>;
    };
    if (!data.field_data) return null;

    const flattened: Record<string, string> = {};
    for (const field of data.field_data) {
      flattened[field.name] = field.values?.[0] ?? "";
    }
    return flattened;
  } catch {
    return null;
  }
}

async function processLeadgenChange(
  admin: ReturnType<typeof createAdminClient>,
  change: MetaLeadgenChange
): Promise<void> {
  const { leadgen_id: leadgenId, page_id: pageId } = change.value;

  const { data: integration } = await admin
    .from("integrations")
    .select("*")
    .eq("type", "meta_lead_ads")
    .filter("config->>pageId", "eq", pageId)
    .maybeSingle();

  if (!integration) return;

  const config = integration.config as IntegrationConfig & { pageAccessToken?: string };
  if (!config.pageAccessToken) {
    await logSystemEvent(admin, {
      orgId: integration.org_id,
      severity: "error",
      entityType: "integration",
      entityId: integration.id,
      eventType: "integration.error",
      message: `${integration.name}: no page access token configured, can't fetch lead ${leadgenId}.`,
    });
    return;
  }

  const fields = await fetchLeadFieldData(leadgenId, config.pageAccessToken);
  if (!fields) {
    await logSystemEvent(admin, {
      orgId: integration.org_id,
      severity: "error",
      entityType: "integration",
      entityId: integration.id,
      eventType: "integration.error",
      message: `${integration.name}: failed to fetch lead ${leadgenId} from the Graph API.`,
    });
    return;
  }

  const requiredFields = config.requiredFields ?? [];
  const missing = findMissingFields(fields, requiredFields);
  if (missing.length > 0) {
    await logSystemEvent(admin, {
      orgId: integration.org_id,
      severity: "error",
      entityType: "integration",
      entityId: integration.id,
      eventType: "integration.validation_failed",
      message: `${integration.name}: lead ${leadgenId} missing fields ${missing.join(", ")}.`,
    });
    return;
  }

  const mapped = applyFieldMapping(fields, config.fieldMapping ?? {});

  await routeLead({
    orgId: integration.org_id,
    source: "meta_lead_ad",
    funnelId: integration.funnel_id,
    name: mapped.name,
    email: mapped.email,
    phone: mapped.phone,
    state: mapped.state,
    zip: mapped.zip,
    productType: mapped.productType,
    dateOfBirth: mapped.dateOfBirth,
    rawPayload: { leadgenId, pageId, ...fields },
  });

  await admin
    .from("integrations")
    .update({ status: "connected", last_event_at: new Date().toISOString(), last_error: null })
    .eq("id", integration.id);
}

/**
 * Meta always expects a fast 200 or it will eventually disable the
 * subscription — so every branch below returns 200 and logs failures
 * internally rather than surfacing them as HTTP errors.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!isValidMetaSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    // Still 200: an invalid signature is almost always Meta's dashboard
    // test button (no META_APP_SECRET configured yet) rather than an
    // attack, and a non-200 here risks Meta disabling the subscription.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const admin = createAdminClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      try {
        await processLeadgenChange(admin, change);
      } catch (err) {
        console.error("Meta leadgen processing failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
