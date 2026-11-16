import type { Topic } from "../domain/tarot/types";
import type { SoundName } from "../shared/audio";

const base = import.meta.env.BASE_URL;

export const cardImage = (cardId: string) => `${base}cards/${cardId}.jpg`;
export const splashImage = (name: Topic | "hero") => `${base}splash/${name}.jpg`;
export const donationQrImage = `${base}splash/qr_donate.jpg`;

export const soundAssets: Record<SoundName, { src: string[]; volume: number; rate?: number; loop?: boolean }> = {
  button: { src: [`${base}sounds/button.wav`], volume: 0.35 },
  pick: { src: [`${base}sounds/select.ogg`, `${base}sounds/select.wav`], volume: 0.35, rate: 1.25 },
  ambient: { src: [`${base}sounds/sound_bg_out.wav`], volume: 0.1, loop: true },
  select: { src: [`${base}sounds/select.ogg`, `${base}sounds/select.wav`], volume: 0.28 },
  shuffle: { src: [`${base}sounds/shuffle.ogg`, `${base}sounds/shuffle.wav`], volume: 0.32, rate: 2.8, loop: true },
  deal: { src: [`${base}sounds/deal.ogg`, `${base}sounds/deal.wav`], volume: 0.22 },
  flip: { src: [`${base}sounds/flip.ogg`, `${base}sounds/flip.wav`], volume: 0.22 },
  "reveal-all": { src: [`${base}sounds/reveal-all.ogg`, `${base}sounds/reveal-all.wav`], volume: 0.22 },
  conclusion: { src: [`${base}sounds/conclusion.ogg`, `${base}sounds/conclusion.wav`], volume: 0.15 },
  success: { src: [`${base}sounds/success.ogg`, `${base}sounds/success.wav`], volume: 0.15 },
};
