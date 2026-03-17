// ─── Sensor Constants ───────────────────────────────────────────────
// Based on: PMC 7869147 (FFT tremor detection, 97.4% sensitivity)
// and Nature Scientific Reports 2022 (4-12 Hz PSD ratio for tremor)
export const SAMPLE_RATE = 60; // Hz — device native rate, Nyquist = 30 Hz (sufficient for 12 Hz tremor)
export const BUFFER_SIZE = 1024; // Gives ~17s window → 0.059 Hz frequency resolution
export const TREMOR_FREQ_MIN = 4; // Hz — lower bound of postural tremor band (Frontiers Neurology 2021)
export const TREMOR_FREQ_MAX = 12; // Hz — upper bound, covers EPT central component 8-12 Hz
export const MEASUREMENT_DURATION = 12; // seconds — sufficient for ~720 samples at 60 Hz
export const CALIBRATION_DURATION = 30; // seconds — longer baseline for stability
export const PASSIVE_UPDATE_INTERVAL = 5; // seconds

// ─── Stress Score Formula Weights ───────────────────────────────────
// Band Power (4-12Hz) gets higher weight because:
// - Stress specifically enhances tremor at 8-12 Hz (EPT literature, AAFP 2018)
// - General hand movement adds to RMS but NOT to 4-12Hz band power
// - Nature Scientific Reports 2022 used PSD ratio in 4-12Hz as primary discriminator
export const STRESS_WEIGHT_RMS = 0.35;
export const STRESS_WEIGHT_BAND_POWER = 0.65;

// Score normalization: baseline (raw=1.0) → score ~2, 3× baseline → score ~10
export const STRESS_SCORE_SCALE = 4.5;

// ─── BPM Mapping — Iso Principle ────────────────────────────────────
// Based on: Iso Principle (Brewer & Campbell, 1991) — match current state, then guide
// Start BPM should match the user's arousal level, then ramp down to target
// Meta-analysis (de Witte et al., 2020): 60-90 BPM = largest stress reduction effect (d=0.900)
export const BPM_MAP: Record<number, [number, number]> = {
  1: [65, 70],    // Already calm — minimal intervention
  2: [65, 70],
  3: [72, 80],    // Mild stress
  4: [78, 88],
  5: [85, 95],    // Moderate stress
  6: [90, 100],
  7: [100, 110],  // High stress — match arousal
  8: [105, 115],
  9: [112, 120],  // Very high — start fast, then slow
  10: [115, 120],
};

// Target BPM: 60 BPM = greatest vagal modulation (Sage Journals, 2019)
// Using 63 as compromise: relaxing but maintains musical engagement
export const TARGET_BPM = 63;
export const MIN_SESSION_MINUTES = 3;
export const MAX_SESSION_MINUTES = 8;

// ─── Relaxation End Conditions ──────────────────────────────────────
export const AUTO_END_SCORE_THRESHOLD = 3;
export const AUTO_END_STABLE_SECONDS = 60;
export const MAX_SESSION_SECONDS = 8 * 60;

// ─── Musical Scales ─────────────────────────────────────────────────
// Pentatonic and modal scales — research shows less dissonance → more relaxation
export const SCALES = {
  calm: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'] as const,         // C major pentatonic
  meditative: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'] as const,  // C minor pentatonic
  dreamy: ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5'] as const, // Whole tone
};

// ─── Colors ─────────────────────────────────────────────────────────
export const STRESS_COLORS = {
  high: { from: '#ef4444', to: '#f97316' },
  medium: { from: '#f97316', to: '#38bdf8' },
  low: { from: '#38bdf8', to: '#7c3aed' },
} as const;

// ─── Breathing Sync ─────────────────────────────────────────────────
// Research: Optimal relaxation at 5.5-6 breaths/min (ScienceDirect, 2013)
// = 10-11 second breath cycles
// At high BPM (120): 120/8 = 15 breaths/min (matches elevated state)
// At target BPM (63): 63/8 ≈ 8 breaths/min (approaching optimal ~6 bpm)
// Using 8 beats per breath brings us closer to the scientifically optimal range
export const BEATS_PER_BREATH = 8;
// Inhale:Exhale ratio — longer exhale activates parasympathetic (vagus nerve)
// Research supports 40:60 or even 33:67 I:E ratio for relaxation
export const INHALE_RATIO = 0.4;
export const EXHALE_RATIO = 0.6;

export const BREATH_CIRCLE_MIN = 100;
export const BREATH_CIRCLE_MAX = 280;
