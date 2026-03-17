import { useCallback, useRef } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useHistoryStore } from '../stores/historyStore';
import { stressToStartBpm, getTransitionDuration } from '../engine/bpmMapper';
import { TARGET_BPM, AUTO_END_SCORE_THRESHOLD, AUTO_END_STABLE_SECONDS, MAX_SESSION_SECONDS } from '../utils/constants';

interface UseSessionManagerReturn {
  startSession: (stressScore: number) => { startBpm: number; targetBpm: number; transitionSeconds: number };
  endSession: () => void;
  tick: () => void;
  shouldAutoEnd: () => boolean;
}

export function useSessionManager(): UseSessionManagerReturn {
  const session = useSessionStore();
  const addSession = useHistoryStore((s) => s.addSession);
  const lowScoreStartRef = useRef<number | null>(null);

  const startSessionFn = useCallback(
    (stressScore: number) => {
      const startBpm = stressToStartBpm(stressScore);
      const targetBpm = TARGET_BPM;
      const transitionSeconds = getTransitionDuration(startBpm);
      session.startSession(stressScore, startBpm, targetBpm);
      lowScoreStartRef.current = null;
      return { startBpm, targetBpm, transitionSeconds };
    },
    [session],
  );

  const endSessionFn = useCallback(() => {
    const data = session.endSession();
    addSession(data);
    session.reset();
  }, [session, addSession]);

  const tick = useCallback(() => {
    session.tick();
  }, [session]);

  const shouldAutoEnd = useCallback(() => {
    const { elapsed, currentScore } = useSessionStore.getState();

    // Max session time
    if (elapsed >= MAX_SESSION_SECONDS) return true;

    // Stable low score
    if (currentScore <= AUTO_END_SCORE_THRESHOLD) {
      if (lowScoreStartRef.current === null) {
        lowScoreStartRef.current = elapsed;
      } else if (elapsed - lowScoreStartRef.current >= AUTO_END_STABLE_SECONDS) {
        return true;
      }
    } else {
      lowScoreStartRef.current = null;
    }

    return false;
  }, []);

  return { startSession: startSessionFn, endSession: endSessionFn, tick, shouldAutoEnd };
}
