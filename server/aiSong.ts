import { Readable } from 'node:stream';

const SAMPLE_RATE = 44_100;
const NOTE_DURATION_SECONDS = 0.38;
const NOTE_COUNT = 8;
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

function hashPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function buildMelody(prompt: string): number[] {
  let seed = hashPrompt(prompt);
  const notes: number[] = [];

  for (let i = 0; i < NOTE_COUNT; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    notes.push(SCALE[seed % SCALE.length]);
  }

  return notes;
}

function writeWav(samples: Int16Array): Buffer {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i], 44 + i * 2);
  }

  return buffer;
}

function synthesizeSong(prompt: string): Buffer {
  const melody = buildMelody(prompt);
  const totalDuration = NOTE_COUNT * NOTE_DURATION_SECONDS;
  const totalSamples = Math.floor(totalDuration * SAMPLE_RATE);
  const samples = new Int16Array(totalSamples);
  const noteLength = Math.floor(NOTE_DURATION_SECONDS * SAMPLE_RATE);

  for (let i = 0; i < totalSamples; i += 1) {
    const noteIndex = Math.min(Math.floor(i / noteLength), melody.length - 1);
    const frequency = melody[noteIndex];
    const bassFrequency = Math.max(frequency / 2, 110);
    const time = i / SAMPLE_RATE;
    const localTime = (i % noteLength) / SAMPLE_RATE;
    const attack = Math.min(localTime / 0.03, 1);
    const release = Math.min((NOTE_DURATION_SECONDS - localTime) / 0.08, 1);
    const envelope = Math.max(0, Math.min(attack, release));

    const lead =
      Math.sin(2 * Math.PI * frequency * time) * 0.42 +
      Math.sin(2 * Math.PI * frequency * 2 * time) * 0.08;
    const bass = Math.sin(2 * Math.PI * bassFrequency * time) * 0.18;
    const pulse = Math.sin(2 * Math.PI * 3 * time) * 0.04;
    const sample = (lead + bass + pulse) * envelope * 0.7;

    samples[i] = Math.max(-1, Math.min(1, sample)) * 32767;
  }

  return writeWav(samples);
}

export async function generateSongStream(prompt: string): Promise<Readable> {
  const stream = Readable.from([synthesizeSong(prompt)]);
  return stream;
}
