import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { BuyersView } from "@/components/buyers/buyers-view";
import type { Database, RoutingOutcome } from "@/lib/types/database";

type BuyerDeliveryMethod = Database["public"]["Tables"]["buyer_delivery_methods"]["Row"];

export default async function BuyersPage() {
  const supabase = await createClient();

  const { data: buyers } = await supabase
    .from("buyers")
    .select("*")
    .order("priority", { ascending: true });

  const buyerIds = (buyers ?? []).map((b) => b.id);

  const [{ data: deliveryMethods }, { data: routedLeads }, { data: routingEvents }] =
    await Promise.all([
      buyerIds.length > 0
        ? supabase.from("buyer_delivery_methods").select("*").in("buyer_id", buyerIds)
        : Promise.resolve({ data: [] as BuyerDeliveryMethod[] }),
      buyerIds.length > 0
        ? supabase
            .from("leads")
            .select("assigned_buyer_id")
            .in("assigned_buyer_id", buyerIds)
            .in("status", ["routed", "sold"])
        : Promise.resolve({ data: [] as { assigned_buyer_id: string | null }[] }),
      buyerIds.length > 0
        ? supabase
            .from("routing_events")
            .select("buyer_id, outcome, explanation, created_at")
            .in("buyer_id", buyerIds)
            .order("created_at", { ascending: false })
            .limit(200)
        : Promise.resolve({
            data: [] as {
              buyer_id: string | null;
              outcome: RoutingOutcome;
              explanation: string | null;
              created_at: string;
            }[],
          }),
    ]);

  const deliveryMethodsByBuyer: Record<string, BuyerDeliveryMethod[]> = {};
  for (const dm of deliveryMethods ?? []) {
    (deliveryMethodsByBuyer[dm.buyer_id] ??= []).push(dm);
  }

  const routedCountByBuyer: Record<string, number> = {};
  for (const lead of routedLeads ?? []) {
    if (!lead.assigned_buyer_id) continue;
    routedCountByBuyer[lead.assigned_buyer_id] = (routedCountByBuyer[lead.assigned_buyer_id] ?? 0) + 1;
  }

  const recentEventsByBuyer: Record<
    string,
    { outcome: RoutingOutcome; explanation: string | null; created_at: string }[]
  > = {};
  for (const event of routingEvents ?? []) {
    if (!event.buyer_id) continue;
    const list = (recentEventsByBuyer[event.buyer_id] ??= []);
    if (list.length < 5) list.push(event);
  }

  return (
    <div>
      <PageHeader
        title="Buyers"
        description="Who receives your leads, and how much of each they'll take."
      />
      <BuyersView
        buyers={buyers ?? []}
        deliveryMethodsByBuyer={deliveryMethodsByBuyer}
        routedCountByBuyer={routedCountByBuyer}
        recentEventsByBuyer={recentEventsByBuyer}
      />
    </div>
  );
}
