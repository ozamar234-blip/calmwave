// Sensor constants
export const SAMPLE_RATE = 60; // Hz
export const BUFFER_SIZE = 1024;
export const TREMOR_FREQ_MIN = 4; // Hz
export const TREMOR_FREQ_MAX = 12; // Hz
export const MEASUREMENT_DURATION = 12; // seconds
export const CALIBRATION_DURATION = 30; // seconds
export const PASSIVE_UPDATE_INTERVAL = 5; // seconds

// BPM mapping: stress score (1-10) to starting BPM
export const BPM_MAP: Record<number, [number, number]> = {
  1: [65, 70],
  2: [65, 70],
  3: [75, 85],
  4: [75, 85],
  5: [85, 95],
  6: [85, 95],
  7: [100, 110],
  8: [100, 110],
  9: [115, 120],
  10: [115, 120],
};

export const TARGET_BPM = 65;
export const MIN_SESSION_MINUTES = 3;
export const MAX_SESSION_MINUTES = 8;

// Relaxation end conditions
export const AUTO_END_SCORE_THRESHOLD = 3;
export const AUTO_END_STABLE_SECONDS = 60;
export const MAX_SESSION_SECONDS = 8 * 60;

// Scales
export const SCALES = {
  calm: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'] as const,
  meditative: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'] as const,
  dreamy: ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5'] as const,
};

// Colors
export const STRESS_COLORS = {
  high: { from: '#ef4444', to: '#f97316' },
  medium: { from: '#f97316', to: '#38bdf8' },
  low: { from: '#38bdf8', to: '#7c3aed' },
} as const;

// Breathing
export const BEATS_PER_BREATH = 4;
export const INHALE_RATIO = 0.4;
export const EXHALE_RATIO = 0.6;

export const BREATH_CIRCLE_MIN = 100;
export const BREATH_CIRCLE_MAX = 280;
