import assert from "node:assert/strict";
import type { HowlOptions } from "howler";
import { afterEach, test, vi } from "vitest";
import { HowlerAudio, type SoundSettings } from "./audio.web";

const { createHowl, sounds, context, mute } = vi.hoisted(() => {
  const sounds: Array<{
    options: HowlOptions;
    state: ReturnType<typeof vi.fn<() => string>>;
    play: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    unload: ReturnType<typeof vi.fn>;
    playing: ReturnType<typeof vi.fn>;
    volume: ReturnType<typeof vi.fn>;
    fade: ReturnType<typeof vi.fn>;
  }> = [];
  const createHowl = vi.fn(function (options: HowlOptions) {
    let playing = false;
    const sound = {
      options, state: vi.fn(() => "loaded"),
      play: vi.fn(() => { playing = true; return 1; }),
      stop: vi.fn(() => { playing = false; }), unload: vi.fn(),
      playing: vi.fn(() => playing), volume: vi.fn(), fade: vi.fn(),
    };
    sounds.push(sound);
    return sound;
  });
  return { createHowl, sounds, context: { state: "running", resume: vi.fn(() => Promise.resolve()) }, mute: vi.fn() };
});

vi.mock("howler", () => ({ Howl: createHowl, Howler: { ctx: context, noAudio: false, mute } }));

afterEach(() => {
  sounds.length = 0;
  vi.clearAllMocks();
  vi.useRealTimers();
  context.state = "running";
});

test("sound is off by default and same-sound playback is interrupted and throttled", () => {
  vi.useFakeTimers();
  const audio = new HowlerAudio(vi.fn());
  audio.play("flip");
  assert.equal(createHowl.mock.calls.length, 0);
  audio.setEnabled(true, true);
  const flip = sounds.find((sound) => sound.options.src?.[0]?.includes("/flip.ogg"));
  assert.ok(flip);
  audio.play("flip");
  audio.play("flip");
  assert.equal(flip.play.mock.calls.length, 1);
  vi.advanceTimersByTime(80);
  audio.play("flip");
  assert.equal(flip.play.mock.calls.length, 2);
  assert.equal(flip.stop.mock.calls.length, 2);
  audio.dispose();
});

test("mute cancels delayed deals and stops shuffle without a later playback", () => {
  vi.useFakeTimers();
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const shuffle = sounds.find((sound) => sound.options.src?.[0]?.includes("/shuffle.ogg"));
  const deal = sounds.find((sound) => sound.options.src?.[0]?.includes("/deal.ogg"));
  assert.ok(shuffle && deal);
  audio.play("shuffle");
  audio.play("deal", 120);
  audio.setEnabled(false);
  vi.advanceTimersByTime(500);
  assert.equal(shuffle.play.mock.calls.length, 1);
  assert.ok(shuffle.stop.mock.calls.length > 0);
  assert.equal(deal.play.mock.calls.length, 0);
  audio.dispose();
});

test("a conclusion is not suppressed by a card selection immediately before it", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const conclusion = sounds.find((sound) => sound.options.src?.[0]?.includes("/conclusion.ogg"));
  assert.ok(conclusion);
  audio.play("select");
  audio.play("conclusion");
  assert.equal(conclusion.play.mock.calls.length, 1);
  audio.dispose();
});

test("stopping a named sound cancels its schedule while another effect can still play", () => {
  vi.useFakeTimers();
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const deal = sounds.find((sound) => sound.options.src?.[0]?.includes("/deal.ogg"));
  const flip = sounds.find((sound) => sound.options.src?.[0]?.includes("/flip.ogg"));
  assert.ok(deal && flip);
  audio.play("deal", 120);
  audio.stop("deal");
  audio.play("flip");
  vi.advanceTimersByTime(200);
  assert.equal(deal.play.mock.calls.length, 0);
  assert.equal(flip.play.mock.calls.length, 1);
  audio.dispose();
});

test("a sound clicked while loading is not queued to play later", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const flip = sounds.find((sound) => sound.options.src?.[0]?.includes("/flip.ogg"));
  assert.ok(flip);
  flip.state.mockReturnValue("loading");
  audio.play("flip");
  flip.state.mockReturnValue("loaded");
  flip.options.onload?.(0);
  assert.equal(flip.play.mock.calls.length, 0);
  audio.dispose();
});

test("loading failures are reported and disable audio without retaining scheduled sounds", () => {
  vi.useFakeTimers();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const updates: SoundSettings[] = [];
  const audio = new HowlerAudio((settings) => updates.push(settings));
  audio.setEnabled(true);
  const failed = sounds[0];
  audio.play("deal", 120);
  failed.options.onloaderror?.(0, "Network error");
  assert.equal(updates.at(-1)?.enabled, false);
  assert.match(updates.at(-1)?.error ?? "", /Âm thanh chưa khả dụng/);
  vi.advanceTimersByTime(500);
  assert.ok(sounds.every((sound) => sound.unload.mock.calls.length === 1));
  assert.ok(sounds.every((sound) => sound.play.mock.calls.length === 0));
  assert.equal(warn.mock.calls.length, 1);
  warn.mockRestore();
});

test("background waits for interaction and loading, fades in, and is not restarted by effects", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const music = sounds.find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.ok(music);
  assert.equal(music.play.mock.calls.length, 0);
  music.state.mockReturnValue("loading");
  audio.interact();
  assert.equal(music.play.mock.calls.length, 0);
  music.state.mockReturnValue("loaded");
  music.options.onload?.(0);
  audio.play("button");
  audio.play("pick");
  assert.equal(music.play.mock.calls.length, 1);
  assert.deepEqual(music.fade.mock.calls[0], [0, 0.12, 1200, 1]);
  audio.dispose();
});

test("background can autoplay when permitted, or wait for browser unlock without disabling sound", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const music = sounds.find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.ok(music);
  audio.requestBackground();
  assert.equal(music.play.mock.calls.length, 1);
  audio.stopAll();
  context.state = "suspended";
  context.resume.mockImplementationOnce(() => new Promise<void>(() => {}));
  audio.requestBackground();
  assert.equal(music.play.mock.calls.length, 1);
  context.state = "running";
  audio.interact();
  assert.equal(music.play.mock.calls.length, 2);
  audio.dispose();
});

test("an autoplay policy rejection keeps audio enabled for the next user interaction", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const updates: SoundSettings[] = [];
  context.state = "suspended";
  context.resume.mockRejectedValueOnce(new DOMException("Interaction required", "NotAllowedError"));
  const audio = new HowlerAudio((settings) => updates.push(settings));
  audio.setEnabled(true);
  audio.requestBackground();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(updates.at(-1)?.enabled, true);
  assert.match(updates.at(-1)?.error ?? "", /bấm một nút/);
  context.state = "running";
  audio.interact();
  assert.equal(updates.at(-1)?.error, "");
  const music = sounds.find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.equal(music?.play.mock.calls.length, 1);
  audio.dispose();
  warn.mockRestore();
});

test("resetting effects preserves background; hiding stops it; returning resumes until muted", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true, true);
  const music = sounds.find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.ok(music);
  audio.stopEffects();
  assert.equal(music.stop.mock.calls.length, 0);
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  audio.stopAll();
  audio.resumeBackground();
  assert.equal(music.play.mock.calls.length, 1);
  hidden.mockReturnValue(false);
  audio.resumeBackground();
  assert.equal(music.play.mock.calls.length, 2);
  audio.setEnabled(false);
  audio.resumeBackground();
  audio.interact();
  assert.equal(music.play.mock.calls.length, 2);
  hidden.mockRestore();
  audio.dispose();
});

test("a pending audio unlock cannot restart background after mute", async () => {
  let resume: (() => void) | undefined;
  context.state = "suspended";
  context.resume.mockImplementationOnce(() => new Promise<void>((resolve) => { resume = resolve; }));
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true, true);
  const music = sounds.find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.ok(music && resume);
  audio.setEnabled(false);
  context.state = "running";
  resume();
  await Promise.resolve();
  assert.equal(music.play.mock.calls.length, 0);
  audio.dispose();
});

test("background requested repeatedly while Howler is waiting only reserves one playback", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true);
  const music = sounds.find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.ok(music);
  music.playing.mockReturnValue(false);
  audio.requestBackground();
  audio.interact();
  audio.requestBackground();
  assert.equal(music.play.mock.calls.length, 1);
  audio.dispose();
});

test("mute closes the master output and unloads pending groups before playback can restart", () => {
  const audio = new HowlerAudio(vi.fn());
  audio.setEnabled(true, true);
  const previousSounds = [...sounds];
  audio.setEnabled(false);
  assert.deepEqual(mute.mock.calls.at(-1), [true]);
  assert.ok(previousSounds.every((sound) => sound.unload.mock.calls.length === 1));
  const plays = previousSounds.map((sound) => sound.play.mock.calls.length);
  previousSounds.forEach((sound) => sound.options.onload?.(0));
  audio.interact();
  assert.deepEqual(previousSounds.map((sound) => sound.play.mock.calls.length), plays);
  audio.setEnabled(true, true);
  assert.deepEqual(mute.mock.calls.at(-1), [false]);
  const newMusic = sounds.slice(previousSounds.length).find((sound) => sound.options.src?.[0]?.includes("/moonlit-ambient.wav"));
  assert.equal(newMusic?.play.mock.calls.length, 1);
  audio.dispose();
});
