import { BPM_MAP, TARGET_BPM, MIN_SESSION_MINUTES, MAX_SESSION_MINUTES } from '../utils/constants';

/**
 * Map a stress score (1-10) to a starting BPM.
 */
export function stressToStartBpm(score: number): number {
  const clamped = Math.max(1, Math.min(10, Math.round(score)));
  const [min, max] = BPM_MAP[clamped];
  return Math.round((min + max) / 2);
}

/**
 * Calculate transition duration (seconds) based on distance from target.
 */
export function getTransitionDuration(startBpm: number): number {
  const distance = startBpm - TARGET_BPM;
  const ratio = distance / (120 - TARGET_BPM); // 0-1
  const minutes =
    MIN_SESSION_MINUTES + ratio * (MAX_SESSION_MINUTES - MIN_SESSION_MINUTES);
  return Math.round(minutes * 60);
}
