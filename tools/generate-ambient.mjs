import { writeFileSync } from "node:fs";

const sampleRate = 24000;
const tau = 2 * Math.PI;

function writeWave(name, seconds, sample) {
  const frames = Math.round(seconds * sampleRate);
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index++) {
    const value = sample(index / sampleRate);
    if (!Number.isFinite(value) || Math.abs(value) > 1) throw new Error(`Invalid sample in ${name}`);
    wav.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }
  writeFileSync(new URL(`../public/sounds/${name}.wav`, import.meta.url), wav);
  console.log(`${name}.wav: ${seconds}s, ${wav.length} bytes`);
}

const duration = 64;
const frequency = (note) => 440 * 2 ** ((note - 69) / 12);
const chords = [[45, 52, 59, 60], [41, 48, 57, 64], [38, 45, 53, 60], [40, 47, 55, 62]]
  .map((notes) => notes.map((note) => Math.round(frequency(note) * duration) / duration));
const melody = [76, 72, 71, 69, 72, 69, 64, 67, 74, 69, 65, 64, 71, 67, 64, 69]
  .map((note, index) => ({ hz: frequency(note), start: index * 4 }));
const echoes = [[0, 1], [0.37, 0.3], [0.83, 0.15]];

// Quantized oscillators and circular chord envelopes meet seamlessly at the loop boundary.
writeWave("moonlit-ambient", duration, (time) => {
  let value = 0;
  for (let chord = 0; chord < chords.length; chord++) {
    const center = chord * 16;
    const distance = Math.min(Math.abs(time - center), duration - Math.abs(time - center));
    if (distance >= 16) continue;
    const envelope = Math.cos(Math.PI * distance / 32) ** 2;
    for (const [voice, hz] of chords[chord].entries()) {
      const phase = voice * 0.7;
      const breath = 0.85 + 0.15 * Math.cos(tau * time / 16 + phase);
      const tone = Math.sin(tau * hz * time + phase)
        + 0.1 * Math.sin(tau * hz * 2 * time + phase);
      value += tone * envelope * breath * (voice === 0 ? 0.04 : 0.025);
    }
  }
  for (const { hz, start } of melody) {
    for (const [delay, gain] of echoes) {
      const age = (time - start - delay + duration) % duration;
      if (age >= 12) continue;
      const envelope = (1 - Math.exp(-age * 70)) * Math.exp(-age * 0.7) * (1 - age / 12) ** 2;
      const bell = Math.sin(tau * hz * age)
        + 0.25 * Math.sin(tau * hz * 2.005 * age) * Math.exp(-age)
        + 0.08 * Math.sin(tau * hz * 3.98 * age) * Math.exp(-age * 2);
      value += bell * envelope * gain * 0.12;
    }
  }
  return value;
});

writeWave("button", 0.085, (time) => {
  const attack = Math.min(time / 0.003, 1);
  const release = (1 - time / 0.085) ** 2 * Math.exp(-time * 45);
  return attack * release * (0.45 * Math.sin(tau * 540 * time)
    + 0.18 * Math.sin(tau * 810 * time) + 0.08 * Math.sin(tau * 1350 * time));
});
