import type { Database, RoutingOutcome } from "@/lib/types/database";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];

export interface EligibilityLead {
  state: string | null;
  productType: string | null;
  intentScore: number;
}

export interface RejectedBuyer {
  buyerId: string;
  outcome: RoutingOutcome;
  explanation: string;
}

export interface EligibilityResult {
  eligible: Buyer[];
  rejected: RejectedBuyer[];
}

function isCapped(buyer: Buyer): string | null {
  if (buyer.daily_cap !== null && buyer.daily_count >= buyer.daily_cap) return "daily";
  if (buyer.weekly_cap !== null && buyer.weekly_count >= buyer.weekly_cap) return "weekly";
  if (buyer.monthly_cap !== null && buyer.monthly_count >= buyer.monthly_cap) return "monthly";
  return null;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Current day-of-week (0=Sun) and "HH:MM" in the org's local timezone. */
function getOrgLocalParts(timezone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return { dayOfWeek: dayMap[weekday] ?? 0, minutesOfDay: hour * 60 + minute };
}

function isWithinAvailability(buyer: Buyer, timezone: string, now: Date): boolean {
  const { dayOfWeek, minutesOfDay } = getOrgLocalParts(timezone, now);

  if (!buyer.available_days.includes(dayOfWeek)) return false;
  if (!buyer.available_start_time || !buyer.available_end_time) return true;

  const start = toMinutes(buyer.available_start_time);
  const end = toMinutes(buyer.available_end_time);

  // Overnight windows (e.g. 20:00-06:00) wrap past midnight.
  return start <= end
    ? minutesOfDay >= start && minutesOfDay <= end
    : minutesOfDay >= start || minutesOfDay <= end;
}

/**
 * Narrows the org's active buyers down to the ones eligible for this lead:
 * accepts the lead's state/product, hasn't hit a cap, meets the min intent
 * score, and is currently within its availability window. Every rejection
 * is recorded with a reason so it can be logged to routing_events.
 */
export function filterEligibleBuyers(
  buyers: Buyer[],
  lead: EligibilityLead,
  orgTimezone: string,
  now: Date = new Date()
): EligibilityResult {
  const eligible: Buyer[] = [];
  const rejected: RejectedBuyer[] = [];

  for (const buyer of buyers) {
    if (buyer.status === "paused" || buyer.status === "archived") {
      rejected.push({
        buyerId: buyer.id,
        outcome: "rejected_paused",
        explanation: `${buyer.name} is ${buyer.status}.`,
      });
      continue;
    }

    if (buyer.states.length > 0 && (!lead.state || !buyer.states.includes(lead.state))) {
      rejected.push({
        buyerId: buyer.id,
        outcome: "rejected_state",
        explanation: lead.state
          ? `${buyer.name} doesn't accept leads from ${lead.state}.`
          : `${buyer.name} only accepts specific states, but this lead has no state on file.`,
      });
      continue;
    }

    if (
      buyer.product_types.length > 0 &&
      (!lead.productType || !buyer.product_types.includes(lead.productType))
    ) {
      rejected.push({
        buyerId: buyer.id,
        outcome: "rejected_state",
        explanation: lead.productType
          ? `${buyer.name} doesn't accept "${lead.productType}" leads.`
          : `${buyer.name} only accepts specific product types, but this lead has none on file.`,
      });
      continue;
    }

    if (lead.intentScore < buyer.min_intent_score) {
      rejected.push({
        buyerId: buyer.id,
        outcome: "rejected_score",
        explanation: `Lead intent score ${lead.intentScore} is below ${buyer.name}'s minimum of ${buyer.min_intent_score}.`,
      });
      continue;
    }

    const capped = isCapped(buyer);
    if (capped) {
      rejected.push({
        buyerId: buyer.id,
        outcome: "rejected_cap",
        explanation: `${buyer.name} has hit its ${capped} cap.`,
      });
      continue;
    }

    if (!isWithinAvailability(buyer, orgTimezone, now)) {
      rejected.push({
        buyerId: buyer.id,
        outcome: "rejected_availability",
        explanation: `${buyer.name} is outside their availability window.`,
      });
      continue;
    }

    eligible.push(buyer);
  }

  return { eligible, rejected };
}
