import {
  computeRMS,
  computeBandPower,
  magnitudeSeries,
} from './signalProcessing';
import {
  SAMPLE_RATE,
  TREMOR_FREQ_MIN,
  TREMOR_FREQ_MAX,
  STRESS_WEIGHT_RMS,
  STRESS_WEIGHT_BAND_POWER,
  STRESS_SCORE_SCALE,
} from '../utils/constants';
import type { CalibrationData, StressResult } from '../types';

/**
 * Compute stress score from acceleration samples relative to calibration baseline.
 *
 * Scientific basis:
 * - RMS captures overall vibration amplitude (ISO 20816-1:2016)
 * - Band Power (4-12Hz) captures frequency-specific tremor energy
 *   associated with Enhanced Physiological Tremor under stress
 *   (Frontiers in Neurology 2021; Nature Scientific Reports 2022)
 * - Band Power weighted higher (0.65) because stress specifically
 *   enhances tremor at 8-12Hz, while general hand movement only
 *   adds to RMS (AAFP 2018, PMC 5144461)
 * - Personal baseline normalization accounts for individual differences
 *   in natural tremor level (validated approach in clinical studies)
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

  // Relative to personal calibration baseline
  const rmsRelative =
    calibration.baselineRms > 0 ? rms / calibration.baselineRms : 1;
  const bandPowerRelative =
    calibration.baselineBandPower > 0
      ? bandPower / calibration.baselineBandPower
      : 1;

  // Weighted combination — Band Power weighted higher for stress specificity
  const raw =
    STRESS_WEIGHT_RMS * rmsRelative +
    STRESS_WEIGHT_BAND_POWER * bandPowerRelative;

  // Normalize to 1-10 scale
  // Baseline (raw ≈ 1.0) maps to ~2, 3× baseline maps to ~10
  const score = Math.round(
    Math.max(1, Math.min(10, 1 + (raw - 1) * STRESS_SCORE_SCALE)),
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
