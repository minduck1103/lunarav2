export type Topic = "love" | "career" | "finance" | "general";
export type SpreadId = "one-card" | "three-card";

export type TarotCard = {
  id: string;
  name: string;
  english: string;
  cardNumber: string;
  arcana: "major" | "minor";
  suit: string | null;
  symbol: string;
  keywords: string[];
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
};
