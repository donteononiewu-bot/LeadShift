import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { AiFunnelBuilderForm } from "@/components/funnels/ai-funnel-builder-form";

export default function AiFunnelBuilderPage() {
  return (
    <div>
      <PageHeader
        title="AI Funnel Builder"
        description="Describe the lead you want to capture, and generate a ready-to-publish quiz."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AiFunnelBuilderForm />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Tips for a strong prompt
            </h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>• Name the product: IUL, term, final expense, mortgage protection.</li>
            <li>• Mention the audience, e.g. &ldquo;homeowners 45-65 in Texas&rdquo;.</li>
            <li>• Call out qualifying questions buyers care about (coverage amount, health, budget).</li>
            <li>• Note the tone: friendly, urgent, educational.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
