"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import { generateFunnelDraft, type GeneratedFunnel } from "@/lib/ai/funnel-generator";

export interface GenerateFunnelResult {
  draft?: GeneratedFunnel;
  error?: string;
}

export async function generateFunnel(prompt: string): Promise<GenerateFunnelResult> {
  if (!prompt.trim()) {
    return { error: "Describe the funnel you want first." };
  }

  try {
    const draft = await generateFunnelDraft(prompt);
    return { draft };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `AI generation failed: ${err.message}`
          : "AI generation failed.",
    };
  }
}

export interface CreateFromDraftResult {
  funnelId?: string;
  error?: string;
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

/**
 * Persists a (possibly user-edited) AI draft as a real draft funnel: one
 * landing page, one question page per question, a contact-info page, a
 * result page, and a booking-redirect page — the same shape the manual
 * builder produces, so it's immediately editable there before publishing.
 */
export async function createFunnelFromDraft(
  prompt: string,
  draft: GeneratedFunnel
): Promise<CreateFromDraftResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const baseSlug = slugify(draft.title);
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

  const { data: funnel, error: funnelError } = await supabase
    .from("funnels")
    .insert({
      org_id: orgId,
      name: draft.title,
      slug,
      type: "quiz",
      status: "draft",
      ai_generated: true,
      ai_prompt: prompt,
    })
    .select("id")
    .single();

  if (funnelError || !funnel) {
    return { error: funnelError?.message ?? "Failed to create funnel." };
  }

  let position = 0;

  const { data: landingPage } = await supabase
    .from("funnel_pages")
    .insert({
      funnel_id: funnel.id,
      page_type: "landing",
      title: draft.landingHeadline,
      subtitle: draft.landingSubheadline,
      position: position++,
      content: { ctaText: draft.ctaText },
    })
    .select("id")
    .single();

  if (!landingPage) return { error: "Failed to create landing page." };

  for (const question of draft.questions) {
    const { data: page } = await supabase
      .from("funnel_pages")
      .insert({
        funnel_id: funnel.id,
        page_type: "question",
        title: question.questionText,
        position: position++,
      })
      .select("id")
      .single();

    if (!page) continue;

    await supabase.from("funnel_questions").insert({
      funnel_page_id: page.id,
      question_text: question.questionText,
      question_type: question.questionType,
      options: question.options,
      is_required: question.isRequired,
      lead_field_mapping: question.leadFieldMapping || null,
      position: 0,
    });
  }

  await supabase.from("funnel_pages").insert({
    funnel_id: funnel.id,
    page_type: "contact_info",
    title: "Get your results",
    position: position++,
    content: { intro: "Enter your info to see your personalized results." },
  });

  await supabase.from("funnel_pages").insert({
    funnel_id: funnel.id,
    page_type: "result",
    title: draft.resultHeadline,
    position: position++,
    content: { body: draft.resultBody },
  });

  await supabase.from("funnel_pages").insert({
    funnel_id: funnel.id,
    page_type: "booking_redirect",
    title: "Connecting you now...",
    position: position++,
    content: { message: draft.bookingRedirectMessage, delaySeconds: "2" },
  });

  return { funnelId: funnel.id };
}
