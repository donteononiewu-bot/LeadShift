import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SystemLogSeverity } from "@/lib/types/database";

export async function logSystemEvent(
  admin: SupabaseClient<Database>,
  params: {
    orgId: string;
    severity?: SystemLogSeverity;
    entityType: string;
    entityId?: string | null;
    eventType: string;
    message: string;
    metadata?: Record<string, unknown>;
  }
) {
  await admin.from("system_logs").insert({
    org_id: params.orgId,
    severity: params.severity ?? "info",
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    event_type: params.eventType,
    message: params.message,
    metadata: params.metadata ?? {},
  });
}
