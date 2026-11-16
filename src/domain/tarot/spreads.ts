import type { SpreadId } from "./types.js";

export const spreads: Array<{ id: SpreadId; label: string; detail: string; positions: string[] }> = [
  { id: "one-card", label: "Một lá", detail: "Thông điệp dành cho bạn", positions: ["Thông điệp"] },
  { id: "three-card", label: "Ba lá", detail: "Quá khứ · Hiện tại · Tương lai", positions: ["Quá khứ", "Hiện tại", "Tương lai"] },
];
