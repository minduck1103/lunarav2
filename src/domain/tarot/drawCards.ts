import { tarotDeck } from "./cards.js";
import { spreads } from "./spreads.js";
import type { SpreadId, TarotCard } from "./types.js";

export function drawCards(spreadId: SpreadId, randomBelow: (limit: number) => number): Array<{ card: TarotCard; isReversed: boolean; position: string }> {
  const spread = spreads.find((item) => item.id === spreadId);
  if (!spread) throw new Error("Kiểu trải bài không hợp lệ.");
  const shuffled = [...tarotDeck];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomBelow(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return spread.positions.map((position, index) => ({
    card: shuffled[index],
    isReversed: randomBelow(100) < 35,
    position,
  }));
}
