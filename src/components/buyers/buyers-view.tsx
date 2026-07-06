"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Pause, Play, Trash2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Building2 } from "lucide-react";
import { BuyerModal } from "./buyer-modal";
import { BuyerStatsDrawer, type RoutingEventSummary } from "./buyer-stats-drawer";
import { setBuyerStatus, deleteBuyer } from "@/lib/actions/buyers";
import type { Database } from "@/lib/types/database";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];
type BuyerDeliveryMethod = Database["public"]["Tables"]["buyer_delivery_methods"]["Row"];

export function BuyersView({
  buyers,
  deliveryMethodsByBuyer,
  routedCountByBuyer,
  recentEventsByBuyer,
}: {
  buyers: Buyer[];
  deliveryMethodsByBuyer: Record<string, BuyerDeliveryMethod[]>;
  routedCountByBuyer: Record<string, number>;
  recentEventsByBuyer: Record<string, RoutingEventSummary[]>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [statsBuyer, setStatsBuyer] = useState<Buyer | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreate() {
    setEditingBuyer(null);
    setModalOpen(true);
  }

  function openEdit(buyer: Buyer) {
    setEditingBuyer(buyer);
    setModalOpen(true);
  }

  function toggleStatus(buyer: Buyer) {
    setActionError(null);
    startTransition(async () => {
      const result = await setBuyerStatus(buyer.id, buyer.status === "active" ? "paused" : "active");
      if (result.error) setActionError(result.error);
    });
  }

  function handleDelete(buyer: Buyer) {
    if (!confirm(`Delete ${buyer.name}? This can't be undone.`)) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteBuyer(buyer.id);
      if (result.error) setActionError(result.error);
    });
  }

  return (
    <div>
      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      )}
      <div className="mb-6 flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add buyer
        </button>
      </div>

      {buyers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{buyer.name}</h3>
                <Badge tone={buyer.status === "active" ? "green" : "slate"}>
                  {buyer.status}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {buyer.states.length > 0 ? buyer.states.join(", ") : "All states"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {buyer.product_types.length > 0 ? buyer.product_types.join(", ") : "All products"}
              </p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Price/lead</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  ${Number(buyer.price_per_lead).toFixed(2)}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <CapRow label="Daily" used={buyer.daily_count} cap={buyer.daily_cap} />
                <CapRow label="Weekly" used={buyer.weekly_count} cap={buyer.weekly_cap} />
                <CapRow label="Monthly" used={buyer.monthly_count} cap={buyer.monthly_cap} />
              </div>

              <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                <ActionButton icon={Pencil} label="Edit" onClick={() => openEdit(buyer)} />
                <ActionButton
                  icon={buyer.status === "active" ? Pause : Play}
                  label={buyer.status === "active" ? "Pause" : "Activate"}
                  onClick={() => toggleStatus(buyer)}
                  disabled={isPending}
                />
                <ActionButton
                  icon={BarChart3}
                  label="Stats"
                  onClick={() => setStatsBuyer(buyer)}
                />
                <ActionButton
                  icon={Trash2}
                  label="Delete"
                  onClick={() => handleDelete(buyer)}
                  disabled={isPending}
                  danger
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No buyers yet"
          description="Add the businesses that purchase your leads, along with their caps, states, and delivery method."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Add buyer
            </button>
          }
        />
      )}

      <BuyerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        buyer={editingBuyer}
        deliveryMethods={editingBuyer ? deliveryMethodsByBuyer[editingBuyer.id] : undefined}
      />

      <BuyerStatsDrawer
        open={statsBuyer !== null}
        onClose={() => setStatsBuyer(null)}
        buyer={statsBuyer}
        totalRouted={statsBuyer ? routedCountByBuyer[statsBuyer.id] ?? 0 : 0}
        recentEvents={statsBuyer ? recentEventsByBuyer[statsBuyer.id] ?? [] : []}
      />
    </div>
  );
}

function CapRow({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label} cap</span>
      <span>{cap === null ? `${used} / unlimited` : `${used} / ${cap}`}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition disabled:opacity-40 ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
