import * as Tone from 'tone';

let calmPlayer: Tone.Player | null = null;
let dynamicPlayer: Tone.Player | null = null;
let crossFade: Tone.CrossFade | null = null;
let noiseSynth: Tone.Noise | null = null;
let noiseFilter: Tone.Filter | null = null;
let noiseReverb: Tone.Reverb | null = null;

/**
 * Initialize generative nature soundscape (no audio files needed for MVP).
 * Uses filtered noise + reverb to create ocean-like ambience.
 */
export function initStemMixer(): void {
  noiseReverb = new Tone.Reverb({ decay: 8, wet: 0.7 }).toDestination();
  noiseFilter = new Tone.Filter({
    frequency: 400,
    type: 'lowpass',
    rolloff: -24,
  }).connect(noiseReverb);

  noiseSynth = new Tone.Noise({
    type: 'pink',
    volume: -28,
  }).connect(noiseFilter);
}

export function startNatureSounds(): void {
  noiseSynth?.start();
}

/**
 * Update nature sound intensity based on stress.
 * High stress = louder, brighter noise (stormy).
 * Low stress = quieter, darker noise (gentle waves).
 */
export function updateNatureIntensity(stressScore: number): void {
  if (!noiseFilter || !noiseSynth) return;
  const relaxation = 1 - (stressScore - 1) / 9;
  noiseFilter.frequency.rampTo(200 + (1 - relaxation) * 600, 5);
  noiseSynth.volume.rampTo(-30 + (1 - relaxation) * 8, 5);
}

export function stopNatureSounds(): void {
  noiseSynth?.stop();
}

export function disposeStemMixer(): void {
  stopNatureSounds();
  noiseSynth?.dispose();
  noiseFilter?.dispose();
  noiseReverb?.dispose();
  calmPlayer?.dispose();
  dynamicPlayer?.dispose();
  crossFade?.dispose();
  noiseSynth = null;
  noiseFilter = null;
  noiseReverb = null;
  calmPlayer = null;
  dynamicPlayer = null;
  crossFade = null;
}
