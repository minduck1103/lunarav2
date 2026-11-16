import assert from "node:assert/strict";
import { test } from "vitest";
import { tarotDeck } from "./cards";
import { drawCards } from "./drawCards";

test("drawing uses the supplied random source without mutating the deck or repeating cards", () => {
  const originalIds = tarotDeck.map((card) => card.id);
  const limits: number[] = [];
  const reading = drawCards("three-card", (limit) => {
    limits.push(limit);
    return limit - 1;
  });

  assert.deepEqual(reading.map((item) => item.card.id), originalIds.slice(0, 3));
  assert.equal(new Set(reading.map((item) => item.card.id)).size, 3);
  assert.deepEqual(reading.map((item) => item.position), ["Quá khứ", "Hiện tại", "Tương lai"]);
  assert.deepEqual(limits.slice(0, -3), Array.from({ length: 77 }, (_, index) => 78 - index));
  assert.deepEqual(limits.slice(-3), [100, 100, 100]);
  assert.deepEqual(tarotDeck.map((card) => card.id), originalIds);
});

test("drawing preserves the reversed-orientation boundary and one-card spread", () => {
  for (const [value, expected] of [[34, true], [35, false]] as const) {
    const reading = drawCards("one-card", (limit) => limit === 100 ? value : limit - 1);
    assert.equal(reading.length, 1);
    assert.equal(reading[0].position, "Thông điệp");
    assert.equal(reading[0].isReversed, expected);
  }
});
