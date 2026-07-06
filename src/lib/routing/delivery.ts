import type { Database, DeliveryMethod } from "@/lib/types/database";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];
type BuyerDeliveryMethod =
  Database["public"]["Tables"]["buyer_delivery_methods"]["Row"];

const DELIVERY_TIMEOUT_MS = 3000;

export interface DeliveryAttempt {
  method: DeliveryMethod;
  target: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  retried: boolean;
}

export interface DeliverySummary {
  attempts: DeliveryAttempt[];
  anySuccess: boolean;
}

async function postOnce(
  url: string,
  method: DeliveryMethod,
  payload: unknown
): Promise<Omit<DeliveryAttempt, "retried">> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return { method, target: url, success: res.ok, statusCode: res.status };
  } catch (err) {
    return {
      method,
      target: url,
      success: false,
      error: err instanceof Error ? err.message : "Request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** POSTs the payload, retrying exactly once if the first attempt fails. */
async function postJson(url: string, payload: unknown): Promise<DeliveryAttempt> {
  const method: DeliveryMethod = url.includes("hooks.zapier.com") ? "zapier" : "webhook";

  const first = await postOnce(url, method, payload);
  if (first.success) return { ...first, retried: false };

  const retry = await postOnce(url, method, payload);
  return { ...retry, retried: true };
}

/**
 * Email/SMS delivery need a provider (Resend, Twilio, etc.) wired up with
 * the org's own API keys — there isn't one configured yet, so these
 * channels are recorded as a deliberate no-op rather than silently failing
 * or calling an unconfigured third party.
 */
function unimplementedChannel(method: DeliveryMethod, target: string): DeliveryAttempt {
  return {
    method,
    target,
    success: false,
    retried: false,
    error: `${method} delivery has no provider configured yet`,
  };
}

export interface DeliveryPayload {
  leadId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  state: string | null;
  productType: string | null;
  intentScore: number;
  answers: Record<string, unknown>;
  source: string;
  createdAt: string;
}

/**
 * Sends a routed lead to every delivery channel enabled for the buyer:
 * the buyer's quick-access webhook_url/zapier_webhook_url plus any rows in
 * buyer_delivery_methods. Runs all channels in parallel with a short
 * per-call timeout so a slow/dead endpoint can't blow the routing budget.
 */
export async function deliverLead(
  buyer: Buyer,
  deliveryMethods: BuyerDeliveryMethod[],
  payload: DeliveryPayload
): Promise<DeliverySummary> {
  const tasks: Promise<DeliveryAttempt>[] = [];

  if (buyer.webhook_url) {
    tasks.push(postJson(buyer.webhook_url, payload));
  }
  if (buyer.zapier_webhook_url) {
    tasks.push(postJson(buyer.zapier_webhook_url, payload));
  }

  for (const dm of deliveryMethods) {
    if (!dm.is_active) continue;

    if (dm.method === "webhook" || dm.method === "zapier" || dm.method === "crm_api") {
      const url = String(dm.config.url ?? "");
      if (url) tasks.push(postJson(url, payload));
      continue;
    }

    if (dm.method === "email") {
      tasks.push(Promise.resolve(unimplementedChannel("email", String(dm.config.to ?? ""))));
      continue;
    }

    if (dm.method === "sms") {
      tasks.push(Promise.resolve(unimplementedChannel("sms", String(dm.config.to ?? ""))));
    }
  }

  if (tasks.length === 0) {
    return { attempts: [], anySuccess: false };
  }

  const attempts = await Promise.all(tasks);
  return { attempts, anySuccess: attempts.some((a) => a.success) };
}
