export interface FunnelQuestionForScoring {
  id: string;
  options: Array<{ label: string; value: string; weight?: number }>;
}

export interface ScoringInput {
  answers: Record<string, unknown>;
  funnelQuestions: FunnelQuestionForScoring[];
  email: string | null;
  phone: string | null;
  state: string | null;
  productType: string | null;
  dateOfBirth: string | null;
}

const BASE_SCORE = 50;
const COMPLETENESS_POINTS = {
  email: 5,
  phone: 10,
  state: 5,
  productType: 5,
  dateOfBirth: 5,
} as const;

/**
 * Scores a lead 0-100. Starts from a neutral baseline, adds points for
 * contact-info completeness (a lead that gave a phone number is more
 * reachable/serious than one that didn't), then adds each question's
 * per-option `weight` (set in the funnel builder) for whatever the lead
 * actually answered. Buyers filter on this via `min_intent_score`.
 */
export function computeIntentScore(input: ScoringInput): number {
  let score = BASE_SCORE;

  if (input.email) score += COMPLETENESS_POINTS.email;
  if (input.phone) score += COMPLETENESS_POINTS.phone;
  if (input.state) score += COMPLETENESS_POINTS.state;
  if (input.productType) score += COMPLETENESS_POINTS.productType;
  if (input.dateOfBirth) score += COMPLETENESS_POINTS.dateOfBirth;

  for (const question of input.funnelQuestions) {
    const answer = input.answers[question.id];
    if (answer === undefined || answer === null || answer === "") continue;

    const answeredValues = Array.isArray(answer)
      ? answer.map(String)
      : [String(answer)];

    for (const value of answeredValues) {
      const option = question.options.find((o) => o.value === value);
      if (option && typeof option.weight === "number") {
        score += option.weight;
      }
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
