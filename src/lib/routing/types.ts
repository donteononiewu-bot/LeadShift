import type {
  LeadDuplicateStatus,
  LeadSourceType,
  LeadStatus,
} from "@/lib/types/database";

export interface RouteLeadInput {
  orgId: string;
  source: LeadSourceType;
  funnelId?: string | null;
  leadSourceId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  zip?: string | null;
  dateOfBirth?: string | null;
  productType?: string | null;
  /** Question-id -> answer, from a funnel submission. */
  answers?: Record<string, unknown>;
  /** The full original payload from whatever sent the lead. */
  rawPayload?: Record<string, unknown>;
}

export interface RouteLeadResult {
  leadId: string;
  status: LeadStatus;
  assignedBuyerId: string | null;
  bookingCalendarUrl: string | null;
  intentScore: number;
  duplicateStatus: LeadDuplicateStatus;
  routingDurationMs: number;
}
