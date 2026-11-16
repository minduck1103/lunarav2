export type SoundName = "button" | "pick" | "ambient" | "select" | "shuffle" | "deal" | "flip" | "reveal-all" | "conclusion" | "success";

export type SoundPlayer = {
  play: (name: SoundName, delayMs?: number) => void;
  stop: (name: SoundName) => void;
  stopEffects: () => void;
  stopAll: () => void;
};
