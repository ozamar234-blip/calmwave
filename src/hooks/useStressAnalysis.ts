import { useCallback, useRef } from 'react';
import { analyzeStress, computeBaseline } from '../engine/stressDetector';
import type { CalibrationData, StressResult } from '../types';

interface UseStressAnalysisReturn {
  analyze: (
    samples: { x: number; y: number; z: number }[],
    calibration: CalibrationData,
  ) => StressResult;
  calibrate: (
    samples: { x: number; y: number; z: number }[],
  ) => CalibrationData;
  lastResult: StressResult | null;
}

export function useStressAnalysis(): UseStressAnalysisReturn {
  const lastResultRef = useRef<StressResult | null>(null);

  const analyze = useCallback(
    (
      samples: { x: number; y: number; z: number }[],
      calibration: CalibrationData,
    ): StressResult => {
      const result = analyzeStress(samples, calibration);
      lastResultRef.current = result;
      return result;
    },
    [],
  );

  const calibrate = useCallback(
    (samples: { x: number; y: number; z: number }[]): CalibrationData => {
      return computeBaseline(samples);
    },
    [],
  );

  return {
    analyze,
    calibrate,
    lastResult: lastResultRef.current,
  };
}
