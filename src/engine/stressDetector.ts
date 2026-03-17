import {
  computeRMS,
  computeBandPower,
  magnitudeSeries,
} from './signalProcessing';
import {
  SAMPLE_RATE,
  TREMOR_FREQ_MIN,
  TREMOR_FREQ_MAX,
} from '../utils/constants';
import type { CalibrationData, StressResult } from '../types';

/**
 * Compute stress score from acceleration samples relative to calibration baseline.
 */
export function analyzeStress(
  samples: { x: number; y: number; z: number }[],
  calibration: CalibrationData,
): StressResult {
  if (samples.length < 64) {
    return { score: 1, rms: 0, bandPower: 0, timestamp: Date.now() };
  }

  const rms = computeRMS(samples);
  const magnitudes = magnitudeSeries(samples);
  const bandPower = computeBandPower(
    magnitudes,
    SAMPLE_RATE,
    TREMOR_FREQ_MIN,
    TREMOR_FREQ_MAX,
  );

  // Relative to baseline
  const rmsRelative =
    calibration.baselineRms > 0 ? rms / calibration.baselineRms : 1;
  const bandPowerRelative =
    calibration.baselineBandPower > 0
      ? bandPower / calibration.baselineBandPower
      : 1;

  // Weighted combination
  const raw = 0.4 * rmsRelative + 0.6 * bandPowerRelative;

  // Normalize to 1-10 scale
  // Baseline (1.0) maps to ~2, 3x baseline maps to ~10
  const score = Math.round(
    Math.max(1, Math.min(10, 1 + (raw - 1) * 4.5)),
  );

  return { score, rms, bandPower, timestamp: Date.now() };
}

/**
 * Compute calibration baseline from "relaxed hand" samples.
 */
export function computeBaseline(
  samples: { x: number; y: number; z: number }[],
): CalibrationData {
  const rms = computeRMS(samples);
  const magnitudes = magnitudeSeries(samples);
  const bandPower = computeBandPower(
    magnitudes,
    SAMPLE_RATE,
    TREMOR_FREQ_MIN,
    TREMOR_FREQ_MAX,
  );

  return {
    baselineRms: rms,
    baselineBandPower: bandPower,
    timestamp: Date.now(),
  };
}
