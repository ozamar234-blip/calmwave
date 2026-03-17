import { create } from 'zustand';
import type { SessionData } from '../types';
import { getSessions, saveSession } from '../db/database';

interface HistoryState {
  sessions: SessionData[];
  loading: boolean;
  loadSessions: () => Promise<void>;
  addSession: (session: SessionData) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  sessions: [],
  loading: false,

  loadSessions: async () => {
    set({ loading: true });
    const sessions = await getSessions(100);
    set({ sessions, loading: false });
  },

  addSession: async (session) => {
    await saveSession(session);
    set((s) => ({ sessions: [session, ...s.sessions] }));
  },
}));
