"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/org";
import type { BuyerStatus } from "@/lib/types/database";

export interface BuyerFormValues {
  name: string;
  email: string;
  phone: string;
  states: string[];
  productTypes: string[];
  minIntentScore: number;
  pricePerLead: number;
  dailyCap: number | null;
  weeklyCap: number | null;
  monthlyCap: number | null;
  weight: number;
  priority: number;
  bookingCalendarUrl: string;
  webhookUrl: string;
  zapierWebhookUrl: string;
  emailDeliveryEnabled: boolean;
  smsDeliveryEnabled: boolean;
  smsPhone: string;
  status: BuyerStatus;
}

export interface BuyerActionResult {
  error?: string;
  buyerId?: string;
}

function buyerRowFromValues(orgId: string, values: BuyerFormValues) {
  return {
    org_id: orgId,
    name: values.name.trim(),
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    status: values.status,
    states: values.states,
    product_types: values.productTypes,
    min_intent_score: values.minIntentScore,
    price_per_lead: values.pricePerLead,
    weight: values.weight,
    priority: values.priority,
    daily_cap: values.dailyCap,
    weekly_cap: values.weeklyCap,
    monthly_cap: values.monthlyCap,
    booking_calendar_url: values.bookingCalendarUrl.trim() || null,
    webhook_url: values.webhookUrl.trim() || null,
    zapier_webhook_url: values.zapierWebhookUrl.trim() || null,
  };
}

async function syncDeliveryMethods(
  supabase: Awaited<ReturnType<typeof createClient>>,
  buyerId: string,
  values: BuyerFormValues
) {
  const channels: Array<{
    method: "email" | "sms";
    enabled: boolean;
    config: Record<string, unknown>;
  }> = [
    { method: "email", enabled: values.emailDeliveryEnabled, config: { to: values.email.trim() } },
    { method: "sms", enabled: values.smsDeliveryEnabled, config: { to: values.smsPhone.trim() } },
  ];

  for (const channel of channels) {
    const { data: existing } = await supabase
      .from("buyer_delivery_methods")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("method", channel.method)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("buyer_delivery_methods")
        .update({ is_active: channel.enabled, config: channel.config })
        .eq("id", existing.id);
    } else if (channel.enabled) {
      await supabase.from("buyer_delivery_methods").insert({
        buyer_id: buyerId,
        method: channel.method,
        is_active: true,
        config: channel.config,
      });
    }
  }
}

export async function createBuyer(values: BuyerFormValues): Promise<BuyerActionResult> {
  if (!values.name.trim()) {
    return { error: "Buyer name is required." };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("buyers")
    .insert(buyerRowFromValues(orgId, values))
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create buyer." };
  }

  await syncDeliveryMethods(supabase, data.id, values);

  revalidatePath("/buyers");
  return { buyerId: data.id };
}

export async function updateBuyer(
  buyerId: string,
  values: BuyerFormValues
): Promise<BuyerActionResult> {
  if (!values.name.trim()) {
    return { error: "Buyer name is required." };
  }

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("buyers")
    .update(buyerRowFromValues(orgId, values))
    .eq("id", buyerId)
    .eq("org_id", orgId);

  if (error) {
    return { error: error.message };
  }

  await syncDeliveryMethods(supabase, buyerId, values);

  revalidatePath("/buyers");
  return { buyerId };
}

export async function setBuyerStatus(
  buyerId: string,
  status: BuyerStatus
): Promise<BuyerActionResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("buyers")
    .update({ status })
    .eq("id", buyerId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/buyers");
  return { buyerId };
}

export async function deleteBuyer(buyerId: string): Promise<BuyerActionResult> {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  if (!orgId) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("buyers")
    .delete()
    .eq("id", buyerId)
    .eq("org_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/buyers");
  return { buyerId };
}
