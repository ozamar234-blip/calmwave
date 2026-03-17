import * as Tone from 'tone';
import { SCALES, TARGET_BPM } from '../utils/constants';

let initialized = false;
let padSynth: Tone.PolySynth | null = null;
let melodySynth: Tone.Synth | null = null;
let bassSynth: Tone.MonoSynth | null = null;
let reverb: Tone.Reverb | null = null;
let delay: Tone.FeedbackDelay | null = null;
let filter: Tone.Filter | null = null;
let autoFilter: Tone.AutoFilter | null = null;
let padLoop: Tone.Loop | null = null;
let melodyLoop: Tone.Loop | null = null;
let bassLoop: Tone.Loop | null = null;
let currentScale: readonly string[] = SCALES.calm;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomNotes(scale: readonly string[], count: number): string[] {
  const notes: string[] = [];
  for (let i = 0; i < count; i++) {
    notes.push(pickRandom(scale));
  }
  return notes;
}

export async function initMusicEngine(): Promise<void> {
  if (initialized) return;

  await Tone.start();

  // Effects chain
  reverb = new Tone.Reverb({ decay: 6, wet: 0.5 }).toDestination();
  delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0.15 }).connect(reverb);
  filter = new Tone.Filter({ frequency: 2000, type: 'lowpass', rolloff: -24 }).connect(delay);
  autoFilter = new Tone.AutoFilter({ frequency: 0.1, baseFrequency: 800, octaves: 2.5 })
    .connect(filter)
    .start();

  // Pad synth — warm ambient pads
  padSynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 1.5,
    envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 2 },
    volume: -18,
  }).connect(autoFilter);

  // Melody synth — gentle ambient melody
  melodySynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 2 },
    volume: -22,
  }).connect(filter);

  // Bass synth — deep soft bass
  bassSynth = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 1.5, decay: 0.8, sustain: 0.7, release: 3 },
    filterEnvelope: { attack: 0.5, decay: 0.3, sustain: 0.5, release: 2, baseFrequency: 100, octaves: 1.5 },
    volume: -20,
  }).connect(reverb);

  initialized = true;
}

export function startPlaying(bpm: number, scale: 'calm' | 'meditative' | 'dreamy' = 'calm'): void {
  if (!initialized) return;

  currentScale = SCALES[scale];
  const transport = Tone.getTransport();
  transport.bpm.value = bpm;
  transport.cancel();

  // Pad chord changes every 2 bars
  padLoop = new Tone.Loop((time) => {
    const chord = pickRandomNotes(currentScale, 3);
    padSynth?.triggerAttackRelease(chord, '2m', time);
  }, '2m');
  padLoop.start(0);

  // Melody — random notes from scale, every 1-2 beats
  let melodyCounter = 0;
  melodyLoop = new Tone.Loop((time) => {
    melodyCounter++;
    // Skip some beats for space
    if (melodyCounter % 3 === 0) return;
    const note = pickRandom(currentScale);
    melodySynth?.triggerAttackRelease(note, '2n', time);
  }, '4n');
  melodyLoop.start(0);

  // Bass — root note, every 2 bars offset by 1 bar
  bassLoop = new Tone.Loop((time) => {
    const bassNote = currentScale[0].replace(/\d/, '2');
    bassSynth?.triggerAttackRelease(bassNote, '1m', time);
  }, '2m');
  bassLoop.start('1m');

  transport.start();
}

/**
 * Smoothly ramp BPM down to target over transitionSeconds.
 */
export function rampBpm(targetBpm: number, transitionSeconds: number): void {
  Tone.getTransport().bpm.rampTo(targetBpm, transitionSeconds);
}

/**
 * Update effects based on current stress score (1-10).
 * Lower stress = more reverb, wider filter, more delay feedback.
 */
export function updateEffects(stressScore: number): void {
  if (!reverb || !delay || !filter) return;

  const relaxation = 1 - (stressScore - 1) / 9; // 0 = high stress, 1 = relaxed
  reverb.wet.rampTo(0.3 + relaxation * 0.5, 5);
  delay.feedback.rampTo(0.1 + relaxation * 0.25, 5);
  filter.frequency.rampTo(1000 + relaxation * 3000, 5);
}

export function getCurrentBpm(): number {
  return Tone.getTransport().bpm.value;
}

export function stopPlaying(): void {
  const transport = Tone.getTransport();
  transport.stop();
  transport.cancel();
  padLoop?.dispose();
  melodyLoop?.dispose();
  bassLoop?.dispose();
  padLoop = null;
  melodyLoop = null;
  bassLoop = null;
}

export function dispose(): void {
  stopPlaying();
  padSynth?.dispose();
  melodySynth?.dispose();
  bassSynth?.dispose();
  reverb?.dispose();
  delay?.dispose();
  filter?.dispose();
  autoFilter?.dispose();
  padSynth = null;
  melodySynth = null;
  bassSynth = null;
  reverb = null;
  delay = null;
  filter = null;
  autoFilter = null;
  initialized = false;
}

export function isInitialized(): boolean {
  return initialized;
}

export function setTargetBpm(): number {
  return TARGET_BPM;
}
