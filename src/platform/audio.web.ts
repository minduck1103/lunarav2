import { Howl, Howler } from "howler";
import type { SoundName, SoundPlayer } from "../shared/audio";
import { soundAssets } from "./assets.web";

export type SoundSettings = { enabled: boolean; loading: boolean; error: string };

export class HowlerAudio implements SoundPlayer {
  private enabled = false;
  private error = "";
  private sounds = new Map<SoundName, Howl>();
  private timers = new Map<number, SoundName>();
  private lastPlayed = new Map<SoundName, number>();
  private generation = 0;
  private musicRequested = false;
  private backgroundId: number | null = null;

  constructor(private readonly onChange: (settings: SoundSettings) => void) {}

  private notify() {
    this.onChange({
      enabled: this.enabled,
      loading: this.enabled && Array.from(this.sounds.values()).some((sound) => sound.state() !== "loaded"),
      error: this.error,
    });
  }

  private fail(name: SoundName | "context", details: unknown) {
    console.warn("Sound playback unavailable", { sound: name, details });
    this.enabled = false;
    Howler.mute(true);
    this.error = "Âm thanh chưa khả dụng. Bạn vẫn có thể đọc bài; bật lại âm thanh để thử lại.";
    this.disposeSounds();
    this.notify();
  }

  private unlock() {
    const context = Howler.ctx;
    if (!context || context.state === "running") {
      this.startBackground();
      return;
    }
    if (context.state === "closed") {
      this.fail("context", "Audio context is closed");
      return;
    }
    const generation = this.generation;
    void context.resume().then(() => {
      if (generation === this.generation) this.startBackground();
    }).catch((error: unknown) => {
      if (!this.enabled || generation !== this.generation) return;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        console.warn("Browser requires interaction before audio playback", error);
        this.error = "Trình duyệt yêu cầu bấm một nút để phát âm thanh.";
        this.notify();
      } else this.fail("context", error);
    });
  }

  private startBackground() {
    const music = this.sounds.get("ambient");
    if (!this.enabled || !this.musicRequested || document.hidden || !music
      || music.state() !== "loaded" || this.backgroundId !== null || music.playing()
      || (Howler.ctx && Howler.ctx.state !== "running")) return;
    if (this.error) {
      this.error = "";
      this.notify();
    }
    music.volume(0);
    const id = music.play();
    this.backgroundId = id;
    music.fade(0, soundAssets.ambient.volume, 1200, id);
  }

  requestBackground() {
    if (!this.enabled) return;
    this.musicRequested = true;
    if (!document.hidden) this.unlock();
  }

  interact() {
    this.requestBackground();
  }

  resumeBackground() {
    if (this.enabled && this.musicRequested && !document.hidden) this.unlock();
  }

  setEnabled(enabled: boolean, userGesture = false) {
    this.enabled = enabled;
    Howler.mute(!enabled);
    if (!enabled) {
      this.musicRequested = false;
      this.disposeSounds();
      this.notify();
      return;
    }
    this.error = "";
    for (const name of Object.keys(soundAssets) as SoundName[]) {
      if (this.sounds.has(name)) continue;
      const asset = soundAssets[name];
      const sound = new Howl({
        src: asset.src,
        volume: asset.volume,
        loop: asset.loop ?? false,
        rate: asset.rate ?? 1,
        preload: true,
        onload: () => {
          if (this.sounds.get(name) !== sound) return;
          this.notify();
          if (name === "ambient") this.startBackground();
        },
        onloaderror: (_id, error) => { if (this.sounds.get(name) === sound) this.fail(name, error); },
        onplayerror: (_id, error) => { if (this.sounds.get(name) === sound) this.fail(name, error); },
      });
      this.sounds.set(name, sound);
    }
    if (Howler.noAudio) {
      this.fail("context", "Browser audio is unavailable");
      return;
    }
    if (userGesture) this.interact();
    this.notify();
  }

  play(name: SoundName, delayMs = 0) {
    if (!this.enabled || document.hidden) return;
    if (name === "ambient") {
      this.interact();
      return;
    }
    this.unlock();
    if (delayMs > 0) {
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        this.play(name);
      }, delayMs);
      this.timers.set(timer, name);
      return;
    }
    const sound = this.sounds.get(name);
    // Do not queue an action to play unexpectedly after loading or browser unlock.
    if (!sound || sound.state() !== "loaded" || (Howler.ctx && Howler.ctx.state !== "running")) return;
    const now = performance.now();
    if (name !== "shuffle" && now - (this.lastPlayed.get(name) ?? -Infinity) < 70) return;
    this.lastPlayed.set(name, now);
    sound.stop();
    sound.play();
  }

  stop(name: SoundName) {
    for (const [timer, scheduledName] of this.timers) {
      if (scheduledName !== name) continue;
      window.clearTimeout(timer);
      this.timers.delete(timer);
    }
    this.sounds.get(name)?.stop();
    if (name === "ambient") this.backgroundId = null;
  }

  stopEffects() {
    for (const timer of this.timers.keys()) window.clearTimeout(timer);
    this.timers.clear();
    for (const [name, sound] of this.sounds) {
      if (name !== "ambient") sound.stop();
    }
    this.lastPlayed.clear();
  }

  stopAll() {
    this.generation++;
    this.stopEffects();
    this.stop("ambient");
  }

  private disposeSounds() {
    this.stopAll();
    const sounds = Array.from(this.sounds.values());
    this.sounds.clear();
    for (const sound of sounds) sound.unload();
  }

  dispose() {
    this.enabled = false;
    this.disposeSounds();
  }
}
