import { create } from 'zustand';
import type { SessionData } from '../types';

interface SessionState {
  active: boolean;
  currentScore: number;
  initialScore: number;
  currentBpm: number;
  targetBpm: number;
  elapsed: number; // seconds
  scores: { time: number; score: number }[];
  startSession: (initialScore: number, startBpm: number, targetBpm: number) => void;
  updateScore: (score: number) => void;
  updateBpm: (bpm: number) => void;
  tick: () => void;
  endSession: () => SessionData;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  active: false,
  currentScore: 0,
  initialScore: 0,
  currentBpm: 80,
  targetBpm: 65,
  elapsed: 0,
  scores: [],

  startSession: (initialScore, startBpm, targetBpm) =>
    set({
      active: true,
      initialScore,
      currentScore: initialScore,
      currentBpm: startBpm,
      targetBpm,
      elapsed: 0,
      scores: [{ time: 0, score: initialScore }],
    }),

  updateScore: (score) =>
    set((s) => ({
      currentScore: score,
      scores: [...s.scores, { time: s.elapsed, score }],
    })),

  updateBpm: (bpm) => set({ currentBpm: bpm }),

  tick: () => set((s) => ({ elapsed: s.elapsed + 1 })),

  endSession: () => {
    const s = get();
    const session: SessionData = {
      id: crypto.randomUUID(),
      startTime: Date.now() - s.elapsed * 1000,
      endTime: Date.now(),
      initialScore: s.initialScore,
      finalScore: s.currentScore,
      scores: s.scores,
      musicStyle: 'ambient-piano',
      duration: s.elapsed,
    };
    set({ active: false });
    return session;
  },

  reset: () =>
    set({
      active: false,
      currentScore: 0,
      initialScore: 0,
      currentBpm: 80,
      targetBpm: 65,
      elapsed: 0,
      scores: [],
    }),
}));
