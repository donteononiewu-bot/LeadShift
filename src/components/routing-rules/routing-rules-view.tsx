"use client";

import { useState, useTransition } from "react";
import { Route, Plus, Pencil, Pause, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoutingRuleModal } from "./routing-rule-modal";
import {
  setRoutingRuleActive,
  deleteRoutingRule,
} from "@/lib/actions/routing-rules";
import type { Database, RoutingStrategy } from "@/lib/types/database";

type RoutingRule = Database["public"]["Tables"]["routing_rules"]["Row"];
type Buyer = Database["public"]["Tables"]["buyers"]["Row"];

const STRATEGY_LABEL: Record<RoutingStrategy, string> = {
  priority: "Priority order",
  weighted: "Weighted",
  round_robin: "Round robin",
  ai_match: "AI match",
};

export function RoutingRulesView({
  rules,
  buyers,
  buyerIdsByRule,
  buyerNamesById,
}: {
  rules: RoutingRule[];
  buyers: Buyer[];
  buyerIdsByRule: Record<string, string[]>;
  buyerNamesById: Record<string, string>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreate() {
    setEditingRule(null);
    setModalOpen(true);
  }

  function openEdit(rule: RoutingRule) {
    setEditingRule(rule);
    setModalOpen(true);
  }

  function toggleActive(rule: RoutingRule) {
    setActionError(null);
    startTransition(async () => {
      const result = await setRoutingRuleActive(rule.id, !rule.is_active);
      if (result.error) setActionError(result.error);
    });
  }

  function handleDelete(rule: RoutingRule) {
    if (!confirm(`Delete "${rule.name}"? This can't be undone.`)) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteRoutingRule(rule.id);
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
          New rule
        </button>
      </div>

      {rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => {
            const assignedBuyerIds = buyerIdsByRule[rule.id] ?? [];
            return (
              <div
                key={rule.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {rule.priority}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{rule.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {rule.states.length > 0 ? rule.states.join(", ") : "All states"}
                        {" · "}
                        Intent {rule.min_intent_score}-{rule.max_intent_score}
                        {" · "}
                        {STRATEGY_LABEL[rule.strategy] ?? rule.strategy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={rule.is_active ? "green" : "slate"}>
                      {rule.is_active ? "Active" : "Paused"}
                    </Badge>
                    <ActionButton icon={Pencil} label="Edit" onClick={() => openEdit(rule)} />
                    <ActionButton
                      icon={rule.is_active ? Pause : Play}
                      label={rule.is_active ? "Pause" : "Activate"}
                      onClick={() => toggleActive(rule)}
                      disabled={isPending}
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Delete"
                      onClick={() => handleDelete(rule)}
                      disabled={isPending}
                      danger
                    />
                  </div>
                </div>
                <p className="mt-2 pl-12 text-xs text-slate-400">
                  Buyers:{" "}
                  {assignedBuyerIds.length > 0
                    ? assignedBuyerIds.map((id) => buyerNamesById[id] ?? "Unknown buyer").join(", ")
                    : "Any eligible active buyer"}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Route}
          title="No routing rules yet"
          description="Define conditions on state, product, and intent score, then choose a strategy to pick among matching buyers."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              New rule
            </button>
          }
        />
      )}

      <RoutingRuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        rule={editingRule}
        ruleBuyerIds={editingRule ? buyerIdsByRule[editingRule.id] ?? [] : undefined}
        buyers={buyers}
      />
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
      className={`flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium transition disabled:opacity-40 ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
