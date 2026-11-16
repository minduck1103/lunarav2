import type { SpreadId, TarotCard, Topic } from "../../domain/tarot/types";

export type DrawnCard = { card: TarotCard; isReversed: boolean; position: string; revealed: boolean };
export type ReadingState = { id: string; topic: Topic; question: string; spreadId: SpreadId; cards: DrawnCard[] };
