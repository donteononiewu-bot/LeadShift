import type { Database, RoutingStrategy } from "@/lib/types/database";

type Buyer = Database["public"]["Tables"]["buyers"]["Row"];

export interface StrategySelection {
  buyer: Buyer;
  explanation: string;
}

function pickRoundRobin(buyers: Buyer[]): StrategySelection {
  // Approximates fairness without a separate rotation-pointer table: the
  // buyer who has received the fewest leads today goes next.
  const buyer = [...buyers].sort((a, b) => a.daily_count - b.daily_count)[0];
  return {
    buyer,
    explanation: `Round robin: ${buyer.name} has the fewest leads today (${buyer.daily_count}).`,
  };
}

function pickWeighted(buyers: Buyer[]): StrategySelection {
  const totalWeight = buyers.reduce((sum, b) => sum + Math.max(b.weight, 0), 0);

  if (totalWeight <= 0) {
    const buyer = buyers[0];
    return { buyer, explanation: `Weighted: no buyer weights set, defaulted to ${buyer.name}.` };
  }

  let roll = Math.random() * totalWeight;
  for (const buyer of buyers) {
    roll -= Math.max(buyer.weight, 0);
    if (roll <= 0) {
      return {
        buyer,
        explanation: `Weighted: ${buyer.name} won the weighted draw (weight ${buyer.weight} of ${totalWeight}).`,
      };
    }
  }

  const buyer = buyers[buyers.length - 1];
  return { buyer, explanation: `Weighted: ${buyer.name} won the weighted draw.` };
}

function pickPriority(buyers: Buyer[]): StrategySelection {
  const buyer = [...buyers].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.weight - a.weight;
  })[0];
  return {
    buyer,
    explanation: `Priority: ${buyer.name} has the highest priority (${buyer.priority}).`,
  };
}

function pickAiMatch(buyers: Buyer[], intentScore: number): StrategySelection {
  const buyer = [...buyers].sort((a, b) => {
    const aDist = Math.abs(intentScore - a.min_intent_score);
    const bDist = Math.abs(intentScore - b.min_intent_score);
    if (aDist !== bDist) return aDist - bDist;
    return b.price_per_lead - a.price_per_lead;
  })[0];
  return {
    buyer,
    explanation: `AI match: ${buyer.name}'s target score (${buyer.min_intent_score}) is closest to this lead's score (${intentScore}).`,
  };
}

/**
 * Picks one buyer from an already-eligible pool. "AI match" is a
 * heuristic (closest intent-score fit, tie-broken by price) rather than a
 * trained model — a reasonable placeholder until real ML scoring exists.
 */
export function selectBuyer(
  buyers: Buyer[],
  strategy: RoutingStrategy,
  intentScore: number
): StrategySelection {
  switch (strategy) {
    case "round_robin":
      return pickRoundRobin(buyers);
    case "weighted":
      return pickWeighted(buyers);
    case "priority":
      return pickPriority(buyers);
    case "ai_match":
      return pickAiMatch(buyers, intentScore);
  }
}
