import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routeLead } from "@/lib/routing/engine";
import type { LeadSourceType } from "@/lib/types/database";

const VALID_SOURCES: LeadSourceType[] = [
  "quiz",
  "webhook",
  "zapier",
  "meta_lead_ad",
  "manual",
  "api",
];

/**
 * Universal internal lead-intake endpoint. The public funnel runtime posts
 * here directly (funnelId resolves the org); external webhook/Zapier/Meta
 * endpoints validate + map their payload, then forward to this same shape
 * so there's exactly one code path that calls the routing engine.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const orgId = typeof body.orgId === "string" ? body.orgId : null;
  const source = typeof body.source === "string" ? (body.source as LeadSourceType) : null;

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }
  if (!source || !VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { error: `source must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Unknown orgId" }, { status: 404 });
  }

  const result = await routeLead({
    orgId,
    source,
    funnelId: typeof body.funnelId === "string" ? body.funnelId : null,
    leadSourceId: typeof body.leadSourceId === "string" ? body.leadSourceId : null,
    name: typeof body.name === "string" ? body.name : null,
    email: typeof body.email === "string" ? body.email : null,
    phone: typeof body.phone === "string" ? body.phone : null,
    state: typeof body.state === "string" ? body.state : null,
    zip: typeof body.zip === "string" ? body.zip : null,
    dateOfBirth: typeof body.dateOfBirth === "string" ? body.dateOfBirth : null,
    productType: typeof body.productType === "string" ? body.productType : null,
    answers: (body.answers as Record<string, unknown>) ?? {},
    rawPayload: body,
  });

  return NextResponse.json(result);
}
