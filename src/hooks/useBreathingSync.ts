import { useMemo } from 'react';
import { BEATS_PER_BREATH, INHALE_RATIO, EXHALE_RATIO } from '../utils/constants';
import type { BreathingState } from '../types';

export function useBreathingSync(currentBpm: number): BreathingState {
  return useMemo(() => {
    const cycleDuration = (60 / currentBpm) * BEATS_PER_BREATH;
    const inhaleDuration = cycleDuration * INHALE_RATIO;
    const exhaleDuration = cycleDuration * EXHALE_RATIO;

    return {
      phase: 'inhale' as const,
      cycleDuration,
      inhaleDuration,
      exhaleDuration,
    };
  }, [currentBpm]);
}
