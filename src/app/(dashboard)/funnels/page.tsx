import Link from "next/link";
import { ListChecks, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Badge } from "@/components/ui/badge";
import { NewFunnelButton } from "@/components/funnels/new-funnel-button";

export default async function FunnelsPage() {
  const supabase = await createClient();

  const { data: funnels } = await supabase
    .from("funnels")
    .select("id, name, type, status, ai_generated, views, submissions, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Quizzes & Funnels"
        description="Lead-capture experiences that feed your routing engine."
        action={
          <div className="flex gap-2">
            <Link
              href="/funnels/ai-builder"
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4" />
              Build with AI
            </Link>
            <NewFunnelButton />
          </div>
        }
      />

      {funnels && funnels.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Submissions</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {funnels.map((funnel) => (
                <tr key={funnel.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <Link
                      href={`/funnels/${funnel.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      {funnel.name}
                      {funnel.ai_generated && (
                        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{funnel.type}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={funnel.status === "published" ? "green" : "slate"}
                    >
                      {funnel.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{funnel.views}</td>
                  <td className="px-4 py-3">{funnel.submissions}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(funnel.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="No funnels yet"
          description="Create a quiz or form to start capturing leads, or generate one instantly with the AI Funnel Builder."
          action={
            <Link
              href="/funnels/ai-builder"
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <Sparkles className="h-4 w-4" />
              Build with AI
            </Link>
          }
        />
      )}
    </div>
  );
}
