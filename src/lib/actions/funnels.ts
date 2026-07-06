"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import type {
  FunnelPageType,
  FunnelQuestionType,
  FunnelStatus,
  FunnelType,
} from "@/lib/types/database";

export interface ActionResult {
  error?: string;
  id?: string;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "funnel"
  );
}

export async function createFunnel(name: string, type: FunnelType): Promise<ActionResult> {
  if (!name.trim()) return { error: "Funnel name is required." };

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const baseSlug = slugify(name);
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const { data: existing } = await supabase
      .from("funnels")
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data, error } = await supabase
    .from("funnels")
    .insert({ org_id: orgId, name: name.trim(), slug, type })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create funnel." };

  revalidatePath("/funnels");
  return { id: data.id };
}

export interface FunnelSettingsValues {
  name: string;
  slug: string;
  status: FunnelStatus;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  metaPixelId: string;
  customHeadScript: string;
  customBodyScript: string;
}

export async function updateFunnelSettings(
  funnelId: string,
  values: FunnelSettingsValues
): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("funnels")
    .update({
      name: values.name.trim(),
      slug: slugify(values.slug),
      status: values.status,
      primary_color: values.primaryColor,
      logo_url: values.logoUrl.trim() || null,
      favicon_url: values.faviconUrl.trim() || null,
      meta_pixel_id: values.metaPixelId.trim() || null,
      custom_head_script: values.customHeadScript.trim() || null,
      custom_body_script: values.customBodyScript.trim() || null,
    })
    .eq("id", funnelId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath(`/funnels/${funnelId}`);
  revalidatePath("/funnels");
  return { id: funnelId };
}

export async function deleteFunnel(funnelId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error } = await supabase.from("funnels").delete().eq("id", funnelId).eq("org_id", orgId);
  if (error) return { error: error.message };

  revalidatePath("/funnels");
  return { id: funnelId };
}

async function assertFunnelOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  funnelId: string
): Promise<string | null> {
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return null;
  const { data } = await supabase
    .from("funnels")
    .select("id")
    .eq("id", funnelId)
    .eq("org_id", orgId)
    .maybeSingle();
  return data ? orgId : null;
}

export async function createFunnelPage(
  funnelId: string,
  pageType: FunnelPageType
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };

  const { data: pages } = await supabase
    .from("funnel_pages")
    .select("position")
    .eq("funnel_id", funnelId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (pages?.[0]?.position ?? -1) + 1;

  const defaultTitles: Record<FunnelPageType, string> = {
    landing: "Welcome",
    question: "New Question",
    contact_info: "Get your results",
    result: "Your results",
    booking_redirect: "Redirecting you now...",
  };

  const { data, error } = await supabase
    .from("funnel_pages")
    .insert({
      funnel_id: funnelId,
      page_type: pageType,
      title: defaultTitles[pageType],
      position: nextPosition,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to add page." };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: data.id };
}

export interface FunnelPageValues {
  title: string;
  subtitle: string;
  content: Record<string, unknown>;
}

export async function updateFunnelPage(
  pageId: string,
  funnelId: string,
  values: FunnelPageValues
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };

  const { error } = await supabase
    .from("funnel_pages")
    .update({
      title: values.title.trim() || null,
      subtitle: values.subtitle.trim() || null,
      content: values.content,
    })
    .eq("id", pageId)
    .eq("funnel_id", funnelId);

  if (error) return { error: error.message };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: pageId };
}

export async function deleteFunnelPage(pageId: string, funnelId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };

  const { error } = await supabase.from("funnel_pages").delete().eq("id", pageId).eq("funnel_id", funnelId);
  if (error) return { error: error.message };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: pageId };
}

export async function reorderFunnelPage(
  pageId: string,
  funnelId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };

  const { data: pages } = await supabase
    .from("funnel_pages")
    .select("id, position")
    .eq("funnel_id", funnelId)
    .order("position", { ascending: true });

  if (!pages) return { error: "Funnel has no pages." };

  const index = pages.findIndex((p) => p.id === pageId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= pages.length) return { id: pageId };

  const a = pages[index];
  const b = pages[swapIndex];

  // funnel_pages has a unique(funnel_id, position) constraint, so a direct
  // two-way swap collides: b's position isn't free until a moves out of the
  // way first. Stage through a temporary out-of-range position instead.
  const { error: e1 } = await supabase
    .from("funnel_pages")
    .update({ position: -1 })
    .eq("id", a.id);
  const { error: e2 } = await supabase
    .from("funnel_pages")
    .update({ position: a.position })
    .eq("id", b.id);
  const { error: e3 } = await supabase
    .from("funnel_pages")
    .update({ position: b.position })
    .eq("id", a.id);

  const error = e1 ?? e2 ?? e3;
  if (error) return { error: error.message };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: pageId };
}

export interface FunnelQuestionValues {
  questionText: string;
  questionType: FunnelQuestionType;
  options: Array<{ label: string; value: string; weight?: number }>;
  isRequired: boolean;
  leadFieldMapping: string;
}

/** Confirms `pageId` is actually a page of `funnelId` (not just any page the org owns). */
async function assertPageInFunnel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pageId: string,
  funnelId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("funnel_pages")
    .select("id")
    .eq("id", pageId)
    .eq("funnel_id", funnelId)
    .maybeSingle();
  return Boolean(data);
}

/** Confirms `questionId`'s parent page belongs to `funnelId`. */
async function assertQuestionInFunnel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionId: string,
  funnelId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("funnel_questions")
    .select("id, funnel_pages!inner(funnel_id)")
    .eq("id", questionId)
    .eq("funnel_pages.funnel_id", funnelId)
    .maybeSingle();
  return Boolean(data);
}

export async function createFunnelQuestion(
  pageId: string,
  funnelId: string,
  values: FunnelQuestionValues
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };
  if (!(await assertPageInFunnel(supabase, pageId, funnelId))) {
    return { error: "That page doesn't belong to this funnel." };
  }

  const { data: questions } = await supabase
    .from("funnel_questions")
    .select("position")
    .eq("funnel_page_id", pageId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (questions?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("funnel_questions")
    .insert({
      funnel_page_id: pageId,
      question_text: values.questionText.trim() || "New question",
      question_type: values.questionType,
      options: values.options,
      is_required: values.isRequired,
      lead_field_mapping: values.leadFieldMapping || null,
      position: nextPosition,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to add question." };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: data.id };
}

export async function updateFunnelQuestion(
  questionId: string,
  funnelId: string,
  values: FunnelQuestionValues
): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };
  if (!(await assertQuestionInFunnel(supabase, questionId, funnelId))) {
    return { error: "That question doesn't belong to this funnel." };
  }

  const { error } = await supabase
    .from("funnel_questions")
    .update({
      question_text: values.questionText.trim() || "New question",
      question_type: values.questionType,
      options: values.options,
      is_required: values.isRequired,
      lead_field_mapping: values.leadFieldMapping || null,
    })
    .eq("id", questionId);

  if (error) return { error: error.message };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: questionId };
}

export async function deleteFunnelQuestion(questionId: string, funnelId: string): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertFunnelOwnership(supabase, funnelId))) return { error: "Not authorized." };
  if (!(await assertQuestionInFunnel(supabase, questionId, funnelId))) {
    return { error: "That question doesn't belong to this funnel." };
  }

  const { error } = await supabase.from("funnel_questions").delete().eq("id", questionId);
  if (error) return { error: error.message };

  revalidatePath(`/funnels/${funnelId}`);
  return { id: questionId };
}
