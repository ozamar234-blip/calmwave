import { useCallback, useRef, useState } from 'react';
import {
  initMusicEngine,
  startPlaying,
  stopPlaying,
  rampBpm,
  updateEffects,
  getCurrentBpm,
  isInitialized,
} from '../engine/musicEngine';
import {
  initStemMixer,
  startNatureSounds,
  stopNatureSounds,
  updateNatureIntensity,
} from '../engine/stemMixer';

interface UseToneEngineReturn {
  isPlaying: boolean;
  isReady: boolean;
  start: (bpm: number, scale?: 'calm' | 'meditative' | 'dreamy') => Promise<void>;
  stop: () => void;
  rampTo: (targetBpm: number, seconds: number) => void;
  updateStress: (score: number) => void;
  getBpm: () => number;
}

export function useToneEngine(): UseToneEngineReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const playingRef = useRef(false);

  const start = useCallback(
    async (bpm: number, scale: 'calm' | 'meditative' | 'dreamy' = 'calm') => {
      if (!isInitialized()) {
        await initMusicEngine();
        initStemMixer();
        setIsReady(true);
      }
      startPlaying(bpm, scale);
      startNatureSounds();
      playingRef.current = true;
      setIsPlaying(true);
    },
    [],
  );

  const stop = useCallback(() => {
    stopPlaying();
    stopNatureSounds();
    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  const rampTo = useCallback((targetBpm: number, seconds: number) => {
    rampBpm(targetBpm, seconds);
  }, []);

  const updateStress = useCallback((score: number) => {
    updateEffects(score);
    updateNatureIntensity(score);
  }, []);

  const getBpm = useCallback(() => {
    return getCurrentBpm();
  }, []);

  return { isPlaying, isReady, start, stop, rampTo, updateStress, getBpm };
}
