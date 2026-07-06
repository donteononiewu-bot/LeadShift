"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { routeLead } from "@/lib/routing/engine";
import type { RouteLeadResult } from "@/lib/routing/types";

export interface StartSubmissionInput {
  funnelId: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}

/**
 * Called once, when a visitor lands on the funnel's first page. Every
 * mutation here is scoped by a server-resolved funnelId/submissionId, never
 * a client-supplied org_id — that's what makes it safe to call without an
 * authenticated session.
 */
export async function startFunnelSubmission(
  input: StartSubmissionInput
): Promise<{ submissionId: string } | { error: string }> {
  const admin = createAdminClient();

  const { data: funnel } = await admin
    .from("funnels")
    .select("id, status")
    .eq("id", input.funnelId)
    .eq("status", "published")
    .maybeSingle();

  if (!funnel) return { error: "Funnel not found." };

  await admin.rpc("increment_funnel_views", { p_funnel_id: funnel.id });

  const { data, error } = await admin
    .from("funnel_submissions")
    .insert({
      funnel_id: funnel.id,
      referrer: input.referrer,
      utm_source: input.utmSource,
      utm_medium: input.utmMedium,
      utm_campaign: input.utmCampaign,
      utm_term: input.utmTerm,
      utm_content: input.utmContent,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to start." };
  return { submissionId: data.id };
}

export async function saveFunnelAnswer(
  submissionId: string,
  questionId: string,
  value: unknown
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("funnel_submissions")
    .select("answers")
    .eq("id", submissionId)
    .single();

  if (!sub) return { error: "Submission not found." };

  const answers = { ...(sub.answers as Record<string, unknown>), [questionId]: value };
  const { error } = await admin
    .from("funnel_submissions")
    .update({ answers })
    .eq("id", submissionId);

  return error ? { error: error.message } : {};
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

/**
 * The last step: merges the visitor's answers with their contact info,
 * derives any lead fields mapped from a question (state, product type,
 * etc.), and hands off to the routing engine.
 */
export async function completeFunnelSubmission(
  submissionId: string,
  contact: ContactInfo
): Promise<RouteLeadResult | { error: string }> {
  const admin = createAdminClient();

  const { data: submission } = await admin
    .from("funnel_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();
  if (!submission) return { error: "Submission not found." };

  const { data: funnel } = await admin
    .from("funnels")
    .select("*")
    .eq("id", submission.funnel_id)
    .single();
  if (!funnel) return { error: "Funnel not found." };

  const { data: questions } = await admin
    .from("funnel_questions")
    .select("id, lead_field_mapping, funnel_pages!inner(funnel_id)")
    .eq("funnel_pages.funnel_id", funnel.id);

  const answers = submission.answers as Record<string, unknown>;
  let state: string | null = null;
  let productType: string | null = null;
  let zip: string | null = null;
  let dateOfBirth: string | null = null;

  for (const q of questions ?? []) {
    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === "") continue;
    if (q.lead_field_mapping === "state") state = String(answer);
    if (q.lead_field_mapping === "product_type") productType = String(answer);
    if (q.lead_field_mapping === "zip") zip = String(answer);
    if (q.lead_field_mapping === "date_of_birth") dateOfBirth = String(answer);
  }

  const result = await routeLead({
    orgId: funnel.org_id,
    source: "quiz",
    funnelId: funnel.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    state,
    zip,
    dateOfBirth,
    productType,
    answers,
    rawPayload: { submissionId, ...contact },
  });

  await admin
    .from("funnel_submissions")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      lead_id: result.leadId,
    })
    .eq("id", submissionId);

  return result;
}

export async function markFunnelRedirect(submissionId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("funnel_submissions")
    .update({ redirected_at: new Date().toISOString() })
    .eq("id", submissionId);
}
