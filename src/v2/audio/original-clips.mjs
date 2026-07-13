export const COMMERCIAL_AUDIO_RELEASE = 'cr1';
export const ORIGINAL_AUDIO_DURATION_SECONDS = 12;
export const ORIGINAL_AUDIO_SAMPLE_RATE = 22050;

const LICENSE = Object.freeze({
  name: 'Creative Commons Attribution 4.0 International',
  shortName: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  commercialUseAllowed: true,
  attributionRequired: true
});

const clip = (definition) => Object.freeze({
  ...definition,
  creator: 'My Music Vibe / betelgeuze-kang',
  rightsHolder: 'My Music Vibe / betelgeuze-kang',
  generated: true,
  samplesUsed: false,
  durationSeconds: ORIGINAL_AUDIO_DURATION_SECONDS,
  sampleRate: ORIGINAL_AUDIO_SAMPLE_RATE,
  channels: 1,
  sourceModule: '/src/v2/audio/original-clips.mjs',
  sourceUrl: 'https://github.com/betelgeuze-kang/music-vibe-test/blob/main/src/v2/audio/original-clips.mjs',
  license: LICENSE,
  attribution: 'Original listening-test audio by My Music Vibe / betelgeuze-kang, licensed under CC BY 4.0.',
  modificationNote: 'Generated at playback time from mathematical oscillators, envelopes, and seeded noise; no third-party samples or melodies are used.',
  verifiedAt: '2026-07-12'
});

export const ORIGINAL_AUDIO_CLIPS = Object.freeze([
  clip({ id: 'groove-pulse-cr1', title: { kr: '탄력 있는 그루브', en: 'Groove Pulse' }, seed: 101, synthesis: 'syncopated bass, kick, snare, and high-frequency noise percussion' }),
  clip({ id: 'dream-space-cr1', title: { kr: '몽환적인 여백', en: 'Dream Space' }, seed: 202, synthesis: 'slow sine-wave pads, suspended intervals, and deterministic filtered noise' }),
  clip({ id: 'organic-room-cr1', title: { kr: '손끝의 울림', en: 'Organic Room' }, seed: 303, synthesis: 'short harmonic plucks, low sine resonance, and a quiet room-noise bed' }),
  clip({ id: 'synthetic-layers-cr1', title: { kr: '변하는 전자 표면', en: 'Synthetic Layers' }, seed: 404, synthesis: 'saw-wave sequence, electronic pulse, and evolving low-frequency modulation' }),
  clip({ id: 'precision-grid-cr1', title: { kr: '정교한 그리드', en: 'Precision Grid' }, seed: 505, synthesis: 'quantized pulse sequence with precise electronic percussion' }),
  clip({ id: 'emotional-afterglow-cr1', title: { kr: '감정의 잔향', en: 'Emotional Afterglow' }, seed: 606, synthesis: 'warm triads, a restrained original interval motif, and soft delay' }),
  clip({ id: 'resolved-arc-cr1', title: { kr: '차곡차곡 쌓이는 흐름', en: 'Resolved Arc' }, seed: 707, synthesis: 'regular harmonic progression with a gradual rhythmic build and clear resolution' }),
  clip({ id: 'playful-turns-cr1', title: { kr: '예상 밖의 전환', en: 'Playful Turns' }, seed: 808, synthesis: 'changing step lengths, original interval cells, and asymmetric percussion' })
]);

export const ORIGINAL_AUDIO_BY_ID = Object.freeze(Object.fromEntries(ORIGINAL_AUDIO_CLIPS.map((item) => [item.id, item])));

const urlCache = new Map();

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function addOscillator(buffer, startSeconds, durationSeconds, frequency, amplitude, type = 'sine', attack = .02, release = .15, phase = 0) {
  const start = Math.max(0, Math.floor(startSeconds * ORIGINAL_AUDIO_SAMPLE_RATE));
  const length = Math.min(Math.floor(durationSeconds * ORIGINAL_AUDIO_SAMPLE_RATE), buffer.length - start);
  if (length <= 0) return;
  const attackSamples = Math.max(1, Math.floor(length * attack));
  const releaseSamples = Math.max(1, Math.floor(length * release));
  for (let index = 0; index < length; index += 1) {
    const time = index / ORIGINAL_AUDIO_SAMPLE_RATE;
    const angle = 2 * Math.PI * frequency * time + phase;
    let sample;
    if (type === 'triangle') sample = 2 / Math.PI * Math.asin(Math.sin(angle));
    else if (type === 'square') sample = Math.sin(angle) >= 0 ? 1 : -1;
    else if (type === 'saw') sample = 2 * ((frequency * time + phase / (2 * Math.PI)) % 1) - 1;
    else sample = Math.sin(angle);
    const fadeIn = Math.min(1, index / attackSamples);
    const fadeOut = Math.min(1, (length - index - 1) / releaseSamples);
    buffer[start + index] += sample * amplitude * Math.min(fadeIn, fadeOut);
  }
}

function addKick(buffer, startSeconds, amplitude = .5) {
  const start = Math.floor(startSeconds * ORIGINAL_AUDIO_SAMPLE_RATE);
  const length = Math.min(Math.floor(.3 * ORIGINAL_AUDIO_SAMPLE_RATE), buffer.length - start);
  for (let index = 0; index < length; index += 1) {
    const time = index / ORIGINAL_AUDIO_SAMPLE_RATE;
    const phase = 2 * Math.PI * (92 * time - 45 * time * time);
    buffer[start + index] += Math.sin(phase) * Math.exp(-time * 16) * amplitude;
  }
}

function addNoiseHit(buffer, startSeconds, random, amplitude = .12, durationSeconds = .08, decay = 45) {
  const start = Math.floor(startSeconds * ORIGINAL_AUDIO_SAMPLE_RATE);
  const length = Math.min(Math.floor(durationSeconds * ORIGINAL_AUDIO_SAMPLE_RATE), buffer.length - start);
  let previous = 0;
  for (let index = 0; index < length; index += 1) {
    const time = index / ORIGINAL_AUDIO_SAMPLE_RATE;
    const noise = random() * 2 - 1;
    const highPassed = noise - previous * .82;
    previous = noise;
    buffer[start + index] += highPassed * Math.exp(-time * decay) * amplitude;
  }
}

function addSnare(buffer, startSeconds, random, amplitude = .22) {
  const start = Math.floor(startSeconds * ORIGINAL_AUDIO_SAMPLE_RATE);
  const length = Math.min(Math.floor(.22 * ORIGINAL_AUDIO_SAMPLE_RATE), buffer.length - start);
  for (let index = 0; index < length; index += 1) {
    const time = index / ORIGINAL_AUDIO_SAMPLE_RATE;
    const noise = (random() * 2 - 1) * Math.exp(-time * 18);
    const body = Math.sin(2 * Math.PI * 182 * time) * Math.exp(-time * 14);
    buffer[start + index] += (noise * .72 + body * .28) * amplitude;
  }
}

function addDelay(buffer, seconds, feedback = .25) {
  const offset = Math.floor(seconds * ORIGINAL_AUDIO_SAMPLE_RATE);
  if (offset <= 0) return;
  const original = new Float32Array(buffer);
  for (let repeat = 1; repeat <= 3; repeat += 1) {
    const distance = offset * repeat;
    const gain = feedback ** repeat;
    for (let index = distance; index < buffer.length; index += 1) buffer[index] += original[index - distance] * gain;
  }
}

function normalize(buffer) {
  const fade = Math.floor(.35 * ORIGINAL_AUDIO_SAMPLE_RATE);
  let peak = .0001;
  for (let index = 0; index < buffer.length; index += 1) peak = Math.max(peak, Math.abs(buffer[index]));
  for (let index = 0; index < buffer.length; index += 1) {
    const fadeIn = Math.min(1, index / fade);
    const fadeOut = Math.min(1, (buffer.length - index - 1) / fade);
    buffer[index] = Math.tanh(buffer[index] / peak * 1.15) * .82 * Math.min(fadeIn, fadeOut);
  }
  return buffer;
}

function baseBuffer() {
  return new Float32Array(Math.floor(ORIGINAL_AUDIO_DURATION_SECONDS * ORIGINAL_AUDIO_SAMPLE_RATE));
}

function groovePulse(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const beat = 60 / 108;
  const bass = [40, 40, 43, 45, 40, 47, 45, 43];
  for (let bar = 0; bar < 5; bar += 1) {
    for (let step = 0; step < 4; step += 1) {
      const time = (bar * 4 + step) * beat;
      addKick(buffer, time, .5);
      if (step === 1 || step === 3) addSnare(buffer, time, random, .2);
      addNoiseHit(buffer, time + beat / 2, random, .07, .06);
    }
    bass.forEach((note, step) => addOscillator(buffer, bar * 4 * beat + step * beat / 2, beat * .42, midi(note), .18, 'triangle', .02, .2));
    [52, 55, 59].forEach((note) => addOscillator(buffer, bar * 4 * beat + beat * .25, beat * .55, midi(note), .035, 'saw', .03, .25));
  }
  return normalize(buffer);
}

function dreamSpace(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const chords = [[45, 52, 57, 60], [43, 50, 55, 59], [40, 47, 52, 55], [42, 49, 54, 57]];
  chords.forEach((chord, chordIndex) => {
    const start = chordIndex * 3;
    chord.forEach((note, noteIndex) => {
      addOscillator(buffer, start, 3.6, midi(note), .055, 'sine', .28, .35, noteIndex * .3);
      addOscillator(buffer, start, 3.4, midi(note) * 2, .012, 'sine', .3, .4);
    });
    addOscillator(buffer, start + .8, 1.7, midi(chord[3] + 7), .055, 'sine', .18, .45);
  });
  for (let index = 0; index < buffer.length; index += 1) buffer[index] += (random() * 2 - 1) * .0025;
  addDelay(buffer, .43, .31);
  return normalize(buffer);
}

function organicRoom(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const beat = 60 / 84;
  const progression = [[48, 55, 60, 64], [45, 52, 57, 60], [43, 50, 55, 59], [47, 54, 59, 62]];
  progression.forEach((chord, bar) => {
    chord.forEach((note, step) => {
      const start = bar * 4 * beat + step * beat;
      [1, 2, 3, 4].forEach((harmonic) => addOscillator(buffer, start, 1.15, midi(note) * harmonic, .09 / harmonic, 'sine', .01, .45, random() * .15));
    });
    addOscillator(buffer, bar * 4 * beat, 4 * beat, midi(chord[0] - 12), .045, 'sine', .08, .35);
  });
  addDelay(buffer, .21, .18);
  return normalize(buffer);
}

function syntheticLayers(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const step = 60 / 122 / 2;
  const notes = [36, 43, 48, 51, 36, 46, 50, 55, 38, 45, 50, 53, 34, 41, 46, 51];
  for (let index = 0; index < Math.floor(ORIGINAL_AUDIO_DURATION_SECONDS / step); index += 1) {
    const time = index * step;
    addOscillator(buffer, time, step * .85, midi(notes[index % notes.length]), .11, 'saw', .02, .2);
    if (index % 2 === 0) addKick(buffer, time, .25);
    if (index % 4 === 2) addSnare(buffer, time, random, .13);
    addNoiseHit(buffer, time + step * .5, random, .03, .05);
  }
  addDelay(buffer, .18, .22);
  return normalize(buffer);
}

function precisionGrid(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const step = 60 / 132 / 4;
  const notes = [60, 64, 67, 71, 62, 65, 69, 72, 59, 62, 67, 69, 57, 60, 64, 67];
  for (let index = 0; index < Math.floor(ORIGINAL_AUDIO_DURATION_SECONDS / step); index += 1) {
    const time = index * step;
    addOscillator(buffer, time, step * .72, midi(notes[index % notes.length]), .075, 'square', .01, .1);
    if (index % 4 === 0) addKick(buffer, time, .3);
    if (index % 8 === 4) addSnare(buffer, time, random, .16);
    if (index % 2 === 1) addNoiseHit(buffer, time, random, .035, .045);
  }
  return normalize(buffer);
}

function emotionalAfterglow(definition) {
  const buffer = baseBuffer();
  const chords = [[48, 55, 60, 64], [45, 52, 57, 60], [53, 57, 60, 65], [43, 50, 55, 59]];
  const motif = [64, 67, 69, 67, 64, 62, 60, 62, 64, 67, 72, 69, 67, 64, 62, 60];
  chords.forEach((chord, bar) => {
    const start = bar * 3;
    chord.forEach((note) => addOscillator(buffer, start, 3.2, midi(note), .05, 'sine', .25, .4));
    for (let step = 0; step < 4; step += 1) addOscillator(buffer, start + step * .75, .6, midi(motif[bar * 4 + step]), .08, 'triangle', .1, .42);
  });
  addDelay(buffer, .34, .32);
  return normalize(buffer);
}

function resolvedArc(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const beat = 60 / 96;
  const progression = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50], [48, 52, 55]];
  progression.forEach((chord, bar) => {
    chord.forEach((note) => addOscillator(buffer, bar * 4 * beat, 4 * beat, midi(note), .04 + bar * .008, 'triangle', .08, .35));
    for (let step = 0; step < 4; step += 1) {
      const time = bar * 4 * beat + step * beat;
      addOscillator(buffer, time, beat * .62, midi(chord[step % 3] + 12), .055 + bar * .004, 'sine', .03, .2);
      if (bar >= 1) addKick(buffer, time, .14 + bar * .02);
      if (bar >= 3 && (step === 1 || step === 3)) addSnare(buffer, time, random, .09 + bar * .01);
    }
  });
  return normalize(buffer);
}

function playfulTurns(definition) {
  const random = mulberry32(definition.seed);
  const buffer = baseBuffer();
  const segments = [[.31, [60, 67, 63, 70, 65]], [.24, [72, 68, 75, 71]], [.39, [55, 62, 58, 65, 61]], [.27, [67, 74, 69, 76]]];
  let time = 0;
  let segment = 0;
  while (time < ORIGINAL_AUDIO_DURATION_SECONDS) {
    const [duration, notes] = segments[segment % segments.length];
    const note = notes[Math.floor(time / duration) % notes.length];
    addOscillator(buffer, time, duration * .78, midi(note), .085, segment % 2 ? 'saw' : 'triangle', .01, .13);
    if (Math.floor(time / duration) % 3 === 0) addKick(buffer, time, .2);
    if (Math.floor(time / duration) % 5 === 2) addSnare(buffer, time, random, .11);
    if (Math.floor(time / duration) % 2 === 1) addNoiseHit(buffer, time + duration * .45, random, .032, .045);
    time += duration;
    segment += 1;
  }
  addDelay(buffer, .15, .18);
  return normalize(buffer);
}

const synthesizers = Object.freeze({
  'groove-pulse-cr1': groovePulse,
  'dream-space-cr1': dreamSpace,
  'organic-room-cr1': organicRoom,
  'synthetic-layers-cr1': syntheticLayers,
  'precision-grid-cr1': precisionGrid,
  'emotional-afterglow-cr1': emotionalAfterglow,
  'resolved-arc-cr1': resolvedArc,
  'playful-turns-cr1': playfulTurns
});

function encodeWav(samples) {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);
  const write = (offset, text) => [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, ORIGINAL_AUDIO_SAMPLE_RATE, true);
  view.setUint32(28, ORIGINAL_AUDIO_SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);
  for (let index = 0; index < samples.length; index += 1) view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, samples[index])) * 0x7fff, true);
  return new Blob([buffer], { type: 'audio/wav' });
}

export function originalAudioRecord(clipId) {
  return ORIGINAL_AUDIO_BY_ID[String(clipId || '')] || null;
}

export function isCommercialAudioClip(clipId) {
  const record = originalAudioRecord(clipId);
  return Boolean(record?.license?.commercialUseAllowed && record?.generated && record?.samplesUsed === false);
}

export async function createOriginalAudioUrl(clipId) {
  const id = String(clipId || '');
  if (globalThis.__musicVibeTestAudioFailure) throw new Error('Synthetic audio failure requested by test hook.');
  if (urlCache.has(id)) return urlCache.get(id);
  const definition = originalAudioRecord(id);
  const synthesize = synthesizers[id];
  if (!definition || !synthesize || !isCommercialAudioClip(id)) throw new Error(`Unregistered commercial audio clip: ${id}`);
  await Promise.resolve();
  const url = URL.createObjectURL(encodeWav(synthesize(definition)));
  urlCache.set(id, url);
  return url;
}

export function releaseOriginalAudioUrls() {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}
