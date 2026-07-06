import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FunnelRuntime } from "@/components/funnels/public/funnel-runtime";

export const dynamic = "force-dynamic";

export default async function PublicFunnelPage({
  params,
}: {
  params: Promise<{ orgSlug: string; funnelSlug: string }>;
}) {
  const { orgSlug, funnelSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  const { data: funnel } = await admin
    .from("funnels")
    .select("*")
    .eq("org_id", org.id)
    .eq("slug", funnelSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!funnel) notFound();

  const { data: pages } = await admin
    .from("funnel_pages")
    .select("*")
    .eq("funnel_id", funnel.id)
    .order("position", { ascending: true });

  const pageIds = (pages ?? []).map((p) => p.id);
  const { data: questions } = await admin
    .from("funnel_questions")
    .select("*")
    .in("funnel_page_id", pageIds.length > 0 ? pageIds : ["00000000-0000-0000-0000-000000000000"])
    .order("position", { ascending: true });

  const questionsByPage: Record<string, NonNullable<typeof questions>> = {};
  for (const q of questions ?? []) {
    (questionsByPage[q.funnel_page_id] ??= []).push(q);
  }

  return (
    <FunnelRuntime
      funnel={funnel}
      pages={pages ?? []}
      questionsByPage={questionsByPage}
    />
  );
}
