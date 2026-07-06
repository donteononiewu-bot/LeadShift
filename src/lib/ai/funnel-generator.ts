import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { FunnelQuestionType } from "@/lib/types/database";

const MODEL = "claude-opus-4-8";

export interface GeneratedQuestion {
  questionText: string;
  questionType: FunnelQuestionType;
  options: Array<{ label: string; value: string; weight: number; disqualifying: boolean }>;
  leadFieldMapping: string;
  isRequired: boolean;
}

export interface GeneratedFunnel {
  title: string;
  landingHeadline: string;
  landingSubheadline: string;
  ctaText: string;
  questions: GeneratedQuestion[];
  leadCaptureFields: string[];
  resultHeadline: string;
  resultBody: string;
  bookingRedirectMessage: string;
}

const QUESTION_SCHEMA = {
  type: "object",
  properties: {
    questionText: { type: "string" },
    questionType: {
      type: "string",
      enum: [
        "single_choice",
        "multiple_choice",
        "text",
        "number",
        "boolean",
        "dropdown",
        "slider",
        "date",
      ],
    },
    options: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: "string" },
          weight: {
            type: "number",
            description:
              "Points added to the lead's 0-100 intent score if this option is chosen. Use negative weight for low-intent answers.",
          },
          disqualifying: {
            type: "boolean",
            description:
              "True if choosing this answer should end the quiz early without capturing a lead (e.g. wrong age range, wrong state, explicitly not interested).",
          },
        },
        required: ["label", "value", "weight", "disqualifying"],
        additionalProperties: false,
      },
    },
    leadFieldMapping: {
      type: "string",
      description:
        "One of: state, product_type, zip, date_of_birth — or empty string if this question doesn't map to a lead field.",
    },
    isRequired: { type: "boolean" },
  },
  required: ["questionText", "questionType", "options", "leadFieldMapping", "isRequired"],
  additionalProperties: false,
} as const;

const FUNNEL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    landingHeadline: { type: "string" },
    landingSubheadline: { type: "string" },
    ctaText: { type: "string" },
    questions: { type: "array", items: QUESTION_SCHEMA },
    leadCaptureFields: {
      type: "array",
      items: { type: "string" },
      description: "Contact fields to collect, e.g. ['name', 'email', 'phone'].",
    },
    resultHeadline: { type: "string" },
    resultBody: { type: "string" },
    bookingRedirectMessage: { type: "string" },
  },
  required: [
    "title",
    "landingHeadline",
    "landingSubheadline",
    "ctaText",
    "questions",
    "leadCaptureFields",
    "resultHeadline",
    "resultBody",
    "bookingRedirectMessage",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You design high-converting lead qualification quizzes for insurance agencies (life insurance, IUL, final expense, annuities, etc).

Given a one-line brief, produce a complete quiz funnel: a landing page headline/subheadline/CTA, 4-7 qualifying questions, a result page, and a booking redirect message.

Rules:
- Each question should meaningfully affect either lead intent score (via per-option "weight", -50 to +50) or disqualify unqualified traffic (via "disqualifying": true on the wrong answer, e.g. wrong age range, wrong state, "just browsing").
- At least one question should map to "state" via leadFieldMapping so the routing engine can filter by geography, unless the brief says otherwise.
- Keep question text and answer labels short and conversational, written for the quiz-taker, not the agency.
- leadCaptureFields should almost always be ["name", "email", "phone"].
- Output only the JSON — no commentary.`;

/**
 * Generates a complete funnel structure from a one-line brief using
 * structured outputs (a JSON-schema-constrained response), so the result is
 * always valid JSON matching GeneratedFunnel — no free-text parsing.
 */
export async function generateFunnelDraft(prompt: string): Promise<GeneratedFunnel> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
    output_config: {
      format: { type: "json_schema", schema: FUNNEL_SCHEMA },
    },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI did not return a text response.");
  }

  return JSON.parse(textBlock.text) as GeneratedFunnel;
}
