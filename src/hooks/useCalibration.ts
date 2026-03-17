import { useState, useCallback, useRef, useEffect } from 'react';
import { computeBaseline } from '../engine/stressDetector';
import { saveCalibration, getCalibration } from '../db/database';
import type { CalibrationData } from '../types';
import { CALIBRATION_DURATION } from '../utils/constants';

interface UseCalibrationReturn {
  calibration: CalibrationData | null;
  isCalibrating: boolean;
  progress: number; // 0-1
  startCalibration: (
    getSamples: () => { x: number; y: number; z: number }[],
    clearBuffer: () => void,
  ) => void;
  loadCalibration: () => Promise<void>;
}

export function useCalibration(): UseCalibrationReturn {
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  const loadCalibration = useCallback(async () => {
    const data = await getCalibration();
    if (data) setCalibration(data);
  }, []);

  const startCalibration = useCallback(
    (
      getSamples: () => { x: number; y: number; z: number }[],
      clearBuffer: () => void,
    ) => {
      setIsCalibrating(true);
      setProgress(0);
      clearBuffer();

      const startTime = Date.now();
      const duration = CALIBRATION_DURATION * 1000;

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(1, elapsed / duration);
        setProgress(p);

        if (p >= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          const samples = getSamples();
          const baseline = computeBaseline(samples);
          saveCalibration(baseline);
          setCalibration(baseline);
          setIsCalibrating(false);
        }
      }, 200);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    calibration,
    isCalibrating,
    progress,
    startCalibration,
    loadCalibration,
  };
}
