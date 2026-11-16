import assert from "node:assert/strict";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, test, vi } from "vitest";
import { useSoundSettings } from "./useSoundSettings";
import type { SoundSettings } from "../../platform/audio.web";

const { enabled, play, interact, stopAll, resumeBackground, requestBackground } = vi.hoisted(() => ({
  enabled: vi.fn(), play: vi.fn(), interact: vi.fn(), stopAll: vi.fn(), resumeBackground: vi.fn(), requestBackground: vi.fn(),
}));
vi.mock("../../platform/audio.web", () => ({
  HowlerAudio: class {
    constructor(private onChange: (settings: SoundSettings) => void) {}
    setEnabled(...args: [boolean, boolean?]) {
      enabled(...args);
      this.onChange({ enabled: args[0], loading: false, error: "" });
    }
    play = play;
    interact = interact;
    stopAll = stopAll;
    resumeBackground = resumeBackground;
    requestBackground = requestBackground;
    dispose = vi.fn();
  },
}));

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLDivElement | undefined;

function Controls() {
  const sound = useSoundSettings();
  return <>
    <button>Tiếp tục</button>
    <button data-sound-handled>Pick thẻ</button>
    <button disabled>Không khả dụng</button>
    <button className="sound-toggle" aria-pressed={sound.enabled} onClick={sound.toggle}>Âm thanh</button>
  </>;
}

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  container?.remove();
  root = undefined;
  localStorage.clear();
  vi.clearAllMocks();
});

async function render() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => { root?.render(<Controls />); });
}

test("every visit enables audio and requests background even after an earlier mute", async () => {
  localStorage.setItem("lunara.sound.enabled", "false");
  await render();
  assert.deepEqual(enabled.mock.calls[0], [true]);
  assert.equal(requestBackground.mock.calls.length, 1);
  await act(async () => { container?.querySelector<HTMLButtonElement>(".sound-toggle")?.click(); });
  assert.deepEqual(enabled.mock.calls.at(-1), [false, true]);
  await act(async () => { root?.unmount(); });
  root = undefined;
  container?.remove();
  localStorage.setItem("lunara.sound.enabled", "false");
  enabled.mockClear();
  await render();
  assert.deepEqual(enabled.mock.calls[0], [true]);
});

test("generic buttons play once, specialized actions do not double-play, and muted controls do not unlock", async () => {
  await render();
  const buttons = container?.querySelectorAll("button");
  assert.ok(buttons);
  await act(async () => { buttons[0].click(); });
  assert.deepEqual(play.mock.calls, [["button"]]);
  await act(async () => { buttons[1].click(); });
  assert.equal(interact.mock.calls.length, 2);
  assert.equal(play.mock.calls.length, 1);
  await act(async () => { buttons[2].click(); buttons[3].click(); });
  assert.equal(interact.mock.calls.length, 2);
});

test("repeated toggle clicks keep the icon state and audio state synchronized", async () => {
  await render();
  const button = container?.querySelector<HTMLButtonElement>(".sound-toggle");
  assert.ok(button);
  for (const next of [false, true, false]) {
    await act(async () => { button.click(); });
    assert.equal(button.getAttribute("aria-pressed"), String(next));
    assert.deepEqual(enabled.mock.calls.at(-1), [next, true]);
  }
});
