import { z } from "zod";
import { tarotDeck } from "./tarotDeck";

export const rulesVersion = "lunara-tarot-rules@1.0";
export const positionIds = {
  "one-card": ["message"],
  "three-card": ["past", "present", "future"],
} as const;

const cardId = z.string().refine((id) => tarotDeck.some((card) => card.id === id));
const orientation = z.enum(["upright", "reversed"]);
const positionId = z.enum(["message", "past", "present", "future"]);
const drawnCardSchema = z.strictObject({ cardId, positionId, orientation });

export const readingRequestSchema = z.strictObject({
  rulesVersion: z.literal(rulesVersion),
  topic: z.enum(["love", "career", "finance", "general"]),
  question: z.string().trim().max(240),
  spreadId: z.enum(["one-card", "three-card"]),
  cards: z.array(drawnCardSchema).min(1).max(3),
}).superRefine((request, context) => {
  const positions = positionIds[request.spreadId];
  if (request.cards.length !== positions.length
    || request.cards.some((card, index) => card.positionId !== positions[index])
    || new Set(request.cards.map((card) => card.cardId)).size !== request.cards.length) {
    context.addIssue({ code: "custom", message: "Invalid spread cards or positions." });
  }
});

export type ReadingRequest = z.infer<typeof readingRequestSchema>;

const text = z.string().trim().min(1).max(1500);
export const interpretationSchema = z.strictObject({
  rulesVersion: z.literal(rulesVersion),
  status: z.enum(["interpreted", "support"]),
  overview: text,
  cards: z.array(z.strictObject({
    cardId: z.string(),
    positionId,
    orientation,
    headline: z.string().trim().min(1).max(180),
    interpretation: text,
  })).max(3),
  synthesis: text,
  advice: z.array(z.string().trim().min(1).max(350)).min(1).max(3),
  reflectionQuestion: z.string().trim().min(1).max(350),
  safetyNote: z.string().trim().min(1).max(700).nullable(),
});

export type InterpretationResult = z.infer<typeof interpretationSchema>;

function wordCount(value: string) {
  return value.trim().split(/\s+/u).length;
}

export function parseInterpretation(value: unknown, request: ReadingRequest): InterpretationResult {
  const result = interpretationSchema.parse(value);
  if (result.status === "support") {
    if (result.cards.length !== 0 || !result.safetyNote) throw new Error("Invalid support response.");
  } else if (result.cards.length !== request.cards.length
    || result.cards.some((card, index) => {
      const drawn = request.cards[index];
      return card.cardId !== drawn.cardId || card.positionId !== drawn.positionId || card.orientation !== drawn.orientation;
    })) {
    throw new Error("Interpretation changed the drawn cards.");
  }
  if (wordCount(result.overview) > 59 || wordCount(result.synthesis) > 117
    || result.cards.some((card) => wordCount(card.headline) > 13 || wordCount(card.interpretation) > 91)
    || result.advice.some((item) => wordCount(item) > 26)) {
    throw new Error("Interpretation exceeds word limits.");
  }
  const prose = [
    result.overview, result.synthesis, result.reflectionQuestion, result.safetyNote ?? "",
    ...result.advice, ...result.cards.flatMap((card) => [card.headline, card.interpretation]),
  ].join("\n");
  if (/chắc chắn sẽ|100\s*%|định mệnh không thể thay đổi|hình minh họa|trang phục|liên minh huyền thoại|riot games|\bprompt\b/iu.test(prose)
    || /\bAI\b/u.test(prose)) {
    throw new Error("Interpretation contains disallowed claims or artwork references.");
  }
  const selected = new Set(request.cards.map((card) => card.cardId));
  if (tarotDeck.some((card) => !selected.has(card.id)
    && (prose.includes(card.english) || prose.includes(card.id)))) {
    throw new Error("Interpretation mentions an undrawn card.");
  }
  return result;
}
