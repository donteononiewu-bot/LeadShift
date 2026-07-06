"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/lib/actions/team";
import type { Database, UserRole } from "@/lib/types/database";

type Member = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "full_name" | "email" | "role" | "created_at"
>;

const ROLE_TONE: Record<UserRole, "brand" | "slate"> = {
  owner: "brand",
  admin: "brand",
  member: "slate",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export function TeamView({
  members,
  currentUserId,
  canManage,
}: {
  members: Member[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleRoleChange(memberId: string, role: UserRole) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateTeamMemberRole(memberId, role);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleRemove(member: Member) {
    if (!confirm(`Remove ${member.full_name || member.email} from this organization?`)) return;
    setActionError(null);
    startTransition(async () => {
      const result = await removeTeamMember(member.id);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </p>
      )}

      {canManage && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              return (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {member.full_name || "—"}
                    {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{member.email}</td>
                  <td className="px-4 py-3">
                    {canManage && !isSelf ? (
                      <select
                        value={member.role}
                        disabled={isPending}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleRemove(member)}
                          disabled={isPending}
                          title="Remove from team"
                          className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inviteOpen && (
        <InviteModal onClose={() => setInviteOpen(false)} onInvited={() => router.refresh()} />
      )}
    </div>
  );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite() {
    setSubmitting(true);
    setError(null);
    const result = await inviteTeamMember(email, role);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onInvited();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invite member</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
        </label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@company.com"
          className={`mb-4 ${inputClass}`}
        />

        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className={`mb-6 ${inputClass}`}
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>

        <button
          onClick={handleInvite}
          disabled={submitting || !email.trim()}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Sending invite..." : "Send invite"}
        </button>
        <p className="mt-2 text-xs text-slate-400">
          Sends a real invite email via Supabase Auth. They&apos;ll land in this
          organization with the role you picked once they accept.
        </p>
      </div>
    </div>
  );
}
