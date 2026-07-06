import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FunnelBuilder } from "@/components/funnels/funnel-builder";
import type { FunnelQuestionType } from "@/lib/types/database";

export default async function FunnelBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: funnel } = await supabase.from("funnels").select("*").eq("id", id).single();
  if (!funnel) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", funnel.org_id)
    .single();

  const { data: pages } = await supabase
    .from("funnel_pages")
    .select("*")
    .eq("funnel_id", id)
    .order("position", { ascending: true });

  const pageIds = (pages ?? []).map((p) => p.id);

  const { data: questions } = await supabase
    .from("funnel_questions")
    .select("*")
    .in("funnel_page_id", pageIds.length > 0 ? pageIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position", { ascending: true });

  const questionsByPage: Record<string, typeof questions> = {};
  for (const q of questions ?? []) {
    (questionsByPage[q.funnel_page_id] ??= []).push(q);
  }

  const [{ data: submissions }, { data: leads }] = await Promise.all([
    supabase
      .from("funnel_submissions")
      .select("id, completed, redirected_at, answers, utm_source, created_at")
      .eq("funnel_id", id),
    supabase
      .from("leads")
      .select("id, status, lead_source_id, source")
      .eq("funnel_id", id),
  ]);

  const allQuestions = (questions ?? []).sort((a, b) => a.position - b.position);
  const dropOff = allQuestions.map((q) => ({
    id: q.id,
    text: q.question_text,
    answered: (submissions ?? []).filter((s) => {
      const answers = s.answers as Record<string, unknown>;
      return answers && answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "";
    }).length,
  }));

  const sourceCounts = new Map<string, { total: number; routed: number }>();
  for (const lead of leads ?? []) {
    const key = lead.source;
    const entry = sourceCounts.get(key) ?? { total: 0, routed: 0 };
    entry.total += 1;
    if (lead.status === "routed" || lead.status === "sold") entry.routed += 1;
    sourceCounts.set(key, entry);
  }

  const analytics = {
    visitors: funnel.views,
    starts: submissions?.length ?? 0,
    completions: (submissions ?? []).filter((s) => s.completed).length,
    leads: leads?.length ?? 0,
    routedLeads: (leads ?? []).filter((l) => l.status === "routed" || l.status === "sold").length,
    bookingRedirects: (submissions ?? []).filter((s) => s.redirected_at).length,
    dropOff,
    sourcePerformance: Array.from(sourceCounts.entries()).map(([source, v]) => ({
      source,
      ...v,
    })),
  };

  return (
    <FunnelBuilder
      funnel={funnel}
      orgSlug={org?.slug ?? ""}
      pages={pages ?? []}
      questionsByPage={questionsByPage as Record<string, { id: string; funnel_page_id: string; question_text: string; question_type: FunnelQuestionType; options: { label: string; value: string; weight?: number }[]; is_required: boolean; position: number; lead_field_mapping: string | null }[]>}
      analytics={analytics}
    />
  );
}
