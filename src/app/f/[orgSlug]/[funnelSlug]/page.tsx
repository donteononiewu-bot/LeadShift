import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FunnelRuntime } from "@/components/funnels/public/funnel-runtime";

export const dynamic = "force-dynamic";

export default async function PublicFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; funnelSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { orgSlug, funnelSlug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  // Preview uses the RLS-scoped client instead of the admin client: RLS on
  // `organizations`/`funnels` only returns rows for the caller's own org, so
  // an unauthenticated visitor or a different org's user gets 404 here —
  // the same query doubles as the auth check. This also means preview can
  // show draft/archived funnels, unlike the public path below.
  const supabase = isPreview ? await createClient() : createAdminClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!org) notFound();

  let funnelQuery = supabase
    .from("funnels")
    .select("*")
    .eq("org_id", org.id)
    .eq("slug", funnelSlug);
  if (!isPreview) {
    funnelQuery = funnelQuery.eq("status", "published");
  }
  const { data: funnel } = await funnelQuery.maybeSingle();
  if (!funnel) notFound();

  const { data: pages } = await supabase
    .from("funnel_pages")
    .select("*")
    .eq("funnel_id", funnel.id)
    .order("position", { ascending: true });

  const pageIds = (pages ?? []).map((p) => p.id);
  const { data: questions } = await supabase
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
      isPreview={isPreview}
    />
  );
}
