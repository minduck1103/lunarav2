import type { Topic } from "./tarotDeck";

const base = import.meta.env.BASE_URL;

export const cardImage = (cardId: string) => `${base}cards/${cardId}.jpg`;
export const splashImage = (name: Topic | "hero") => `${base}splash/${name}.jpg`;
