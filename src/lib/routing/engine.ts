import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, RoutingOutcome } from "@/lib/types/database";
import { findDuplicate, normalizeEmail, normalizePhone } from "./dedupe";
import { computeIntentScore } from "./scoring";
import { filterEligibleBuyers, type RejectedBuyer } from "./eligibility";
import { selectBuyer } from "./strategies";
import { deliverLead } from "./delivery";
import { logSystemEvent } from "./logging";
import type { RouteLeadInput, RouteLeadResult } from "./types";

const ROUTING_TIME_BUDGET_MS = 2000;

type RoutingRuleRow = Database["public"]["Tables"]["routing_rules"]["Row"];

function ruleMatches(
  rule: RoutingRuleRow,
  lead: { state: string | null; productType: string | null; source: string; intentScore: number }
): boolean {
  if (rule.states.length > 0 && (!lead.state || !rule.states.includes(lead.state))) return false;
  if (
    rule.product_types.length > 0 &&
    (!lead.productType || !rule.product_types.includes(lead.productType))
  )
    return false;
  if (rule.sources.length > 0 && !rule.sources.includes(lead.source as never)) return false;
  if (lead.intentScore < rule.min_intent_score || lead.intentScore > rule.max_intent_score)
    return false;
  return true;
}

/**
 * The core of LeadShift: takes a captured lead's data, persists it, dedupes,
 * scores intent, finds the right buyer, and delivers. Called from the
 * public funnel runtime, webhook/Zapier/Meta intake endpoints, and manual
 * lead creation alike — all of them just build a RouteLeadInput.
 *
 * Target: end-to-end under 2 seconds. See ROUTING_TIME_BUDGET_MS.
 */
export async function routeLead(input: RouteLeadInput): Promise<RouteLeadResult> {
  const startedAt = Date.now();
  const admin = createAdminClient();

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  const [{ data: org }, { data: buyers }, { data: routingRules }, { data: funnelQuestions }, duplicate] =
    await Promise.all([
      admin.from("organizations").select("timezone").eq("id", input.orgId).single(),
      admin.from("buyers").select("*").eq("org_id", input.orgId).order("priority", { ascending: true }),
      admin
        .from("routing_rules")
        .select("*")
        .eq("org_id", input.orgId)
        .eq("is_active", true)
        .order("priority", { ascending: true }),
      input.funnelId
        ? admin
            .from("funnel_questions")
            .select("id, options, funnel_pages!inner(funnel_id)")
            .eq("funnel_pages.funnel_id", input.funnelId)
        : Promise.resolve({ data: [] as { id: string; options: { label: string; value: string; weight?: number }[] }[] }),
      findDuplicate(admin, input.orgId, email, phone),
    ]);

  const intentScore = computeIntentScore({
    answers: input.answers ?? {},
    funnelQuestions: (funnelQuestions ?? []).map((q) => ({ id: q.id, options: q.options })),
    email,
    phone,
    state: input.state ?? null,
    productType: input.productType ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
  });

  const orgTimezone = org?.timezone ?? "America/New_York";

  // Recent accidental double-submits (same email + phone within 5 minutes)
  // are rejected outright rather than routed a second time.
  if (duplicate.isRecentResubmission) {
    const { data: insertedLead } = await admin
      .from("leads")
      .insert({
        org_id: input.orgId,
        funnel_id: input.funnelId ?? null,
        lead_source_id: input.leadSourceId ?? null,
        source: input.source,
        status: "rejected",
        name: input.name ?? null,
        email,
        phone,
        state: input.state ?? null,
        zip: input.zip ?? null,
        date_of_birth: input.dateOfBirth ?? null,
        product_type: input.productType ?? null,
        answers: input.answers ?? {},
        intent_score: intentScore,
        raw_payload: input.rawPayload ?? {},
        duplicate_status: duplicate.status,
        duplicate_of_lead_id: duplicate.duplicateOfLeadId,
        routing_duration_ms: Date.now() - startedAt,
      })
      .select("id")
      .single();

    await logSystemEvent(admin, {
      orgId: input.orgId,
      severity: "warning",
      entityType: "lead",
      entityId: insertedLead?.id,
      eventType: "lead.rejected",
      message: "Lead rejected: identical submission received within the last 5 minutes.",
    });

    return {
      leadId: insertedLead?.id ?? "",
      status: "rejected",
      assignedBuyerId: null,
      bookingCalendarUrl: null,
      intentScore,
      duplicateStatus: duplicate.status,
      routingDurationMs: Date.now() - startedAt,
    };
  }

  const matchedRule = (routingRules ?? []).find((rule) =>
    ruleMatches(rule, {
      state: input.state ?? null,
      productType: input.productType ?? null,
      source: input.source,
      intentScore,
    })
  );

  const { eligible, rejected } = filterEligibleBuyers(
    buyers ?? [],
    { state: input.state ?? null, productType: input.productType ?? null, intentScore },
    orgTimezone
  );

  // Insert the lead row now that we know everything except the final buyer.
  const { data: insertedLead } = await admin
    .from("leads")
    .insert({
      org_id: input.orgId,
      funnel_id: input.funnelId ?? null,
      lead_source_id: input.leadSourceId ?? null,
      source: input.source,
      status: "routing",
      name: input.name ?? null,
      email,
      phone,
      state: input.state ?? null,
      zip: input.zip ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      product_type: input.productType ?? null,
      answers: input.answers ?? {},
      intent_score: intentScore,
      raw_payload: input.rawPayload ?? {},
      duplicate_status: duplicate.status,
      duplicate_of_lead_id: duplicate.duplicateOfLeadId,
    })
    .select("id")
    .single();

  const leadId = insertedLead?.id ?? "";

  await logSystemEvent(admin, {
    orgId: input.orgId,
    entityType: "lead",
    entityId: leadId,
    eventType: "lead.captured",
    message: `Lead captured from ${input.source} (intent score ${intentScore}).`,
  });

  if (eligible.length === 0) {
    await admin
      .from("leads")
      .update({
        status: "unmatched",
        routing_duration_ms: Date.now() - startedAt,
      })
      .eq("id", leadId);

    await admin.from("routing_events").insert({
      lead_id: leadId,
      buyer_id: null,
      routing_rule_id: matchedRule?.id ?? null,
      attempt_order: 0,
      outcome: "no_buyers_matched" as RoutingOutcome,
      explanation: summarizeRejections(rejected),
    });

    await logSystemEvent(admin, {
      orgId: input.orgId,
      severity: "warning",
      entityType: "lead",
      entityId: leadId,
      eventType: "lead.unmatched",
      message: "No eligible buyer found for this lead.",
    });

    return {
      leadId,
      status: "unmatched",
      assignedBuyerId: null,
      bookingCalendarUrl: null,
      intentScore,
      duplicateStatus: duplicate.status,
      routingDurationMs: Date.now() - startedAt,
    };
  }

  const strategy = matchedRule?.strategy ?? "priority";
  const { buyer, explanation } = selectBuyer(eligible, strategy, intentScore);

  // Log every buyer considered: rejections first, then the winning pick.
  const events = rejected.map((r, i) => ({
    lead_id: leadId,
    buyer_id: r.buyerId,
    routing_rule_id: matchedRule?.id ?? null,
    attempt_order: i + 1,
    outcome: r.outcome,
    explanation: r.explanation,
  }));
  events.push({
    lead_id: leadId,
    buyer_id: buyer.id,
    routing_rule_id: matchedRule?.id ?? null,
    attempt_order: events.length + 1,
    outcome: "accepted" as RoutingOutcome,
    explanation,
  });
  await admin.from("routing_events").insert(events);

  await admin.rpc("increment_buyer_counts", { p_buyer_id: buyer.id });

  const routingDurationMs = Date.now() - startedAt;
  await admin
    .from("leads")
    .update({
      assigned_buyer_id: buyer.id,
      status: "routed",
      routed_at: new Date().toISOString(),
      routing_duration_ms: routingDurationMs,
    })
    .eq("id", leadId);

  await logSystemEvent(admin, {
    orgId: input.orgId,
    entityType: "lead",
    entityId: leadId,
    eventType: "lead.routed",
    message: `Routed to ${buyer.name} in ${routingDurationMs}ms. ${explanation}`,
  });

  if (routingDurationMs > ROUTING_TIME_BUDGET_MS) {
    await logSystemEvent(admin, {
      orgId: input.orgId,
      severity: "warning",
      entityType: "lead",
      entityId: leadId,
      eventType: "routing.slow",
      message: `Routing took ${routingDurationMs}ms, over the ${ROUTING_TIME_BUDGET_MS}ms target.`,
    });
  }

  // Delivery happens after the routing decision is durable, so a slow/dead
  // buyer endpoint can't delay the response the caller is waiting on for
  // the booking redirect.
  const { data: deliveryMethods } = await admin
    .from("buyer_delivery_methods")
    .select("*")
    .eq("buyer_id", buyer.id)
    .eq("is_active", true);

  const delivery = await deliverLead(buyer, deliveryMethods ?? [], {
    leadId,
    name: input.name ?? null,
    email,
    phone,
    state: input.state ?? null,
    productType: input.productType ?? null,
    intentScore,
    answers: input.answers ?? {},
    source: input.source,
    createdAt: new Date().toISOString(),
  });

  if (delivery.attempts.length > 0) {
    await admin.from("routing_events").insert({
      lead_id: leadId,
      buyer_id: buyer.id,
      routing_rule_id: matchedRule?.id ?? null,
      attempt_order: events.length + 1,
      outcome: delivery.anySuccess ? "delivery_success" : "delivery_failed",
      explanation: delivery.attempts
        .map(
          (a) =>
            `${a.method} ${a.success ? "succeeded" : `failed${a.retried ? " after retry" : ""}${a.error ? `: ${a.error}` : ""}`}`
        )
        .join("; "),
    });

    await logSystemEvent(admin, {
      orgId: input.orgId,
      severity: delivery.anySuccess ? "info" : "error",
      entityType: "lead",
      entityId: leadId,
      eventType: delivery.anySuccess ? "lead.delivered" : "lead.delivery_failed",
      message: `Delivery to ${buyer.name}: ${delivery.attempts
        .map((a) => `${a.method} ${a.success ? "ok" : "failed"}`)
        .join(", ")}`,
    });
  }

  return {
    leadId,
    status: "routed",
    assignedBuyerId: buyer.id,
    bookingCalendarUrl: buyer.booking_calendar_url,
    intentScore,
    duplicateStatus: duplicate.status,
    routingDurationMs,
  };
}

function summarizeRejections(rejected: RejectedBuyer[]): string {
  if (rejected.length === 0) return "No active buyers exist for this organization.";
  return `All ${rejected.length} candidate buyer(s) were ineligible: ${rejected
    .map((r) => r.explanation)
    .join(" ")}`;
}
