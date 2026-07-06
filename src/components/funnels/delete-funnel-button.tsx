"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteFunnel } from "@/lib/actions/funnels";

export function DeleteFunnelButton({ funnelId, name }: { funnelId: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteFunnel(funnelId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="relative">
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Delete funnel"
        className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && (
        <span className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 shadow dark:bg-red-950 dark:text-red-300">
          {error}
        </span>
      )}
    </span>
  );
}
