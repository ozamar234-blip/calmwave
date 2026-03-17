import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MusicStyle, PermissionStatus } from '../types';

interface AppState {
  onboarded: boolean;
  calibrated: boolean;
  motionPermission: PermissionStatus;
  preferredMusicStyle: MusicStyle;
  setOnboarded: (v: boolean) => void;
  setCalibrated: (v: boolean) => void;
  setMotionPermission: (v: PermissionStatus) => void;
  setPreferredMusicStyle: (v: MusicStyle) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      calibrated: false,
      motionPermission: 'prompt',
      preferredMusicStyle: 'ambient-piano',
      setOnboarded: (v) => set({ onboarded: v }),
      setCalibrated: (v) => set({ calibrated: v }),
      setMotionPermission: (v) => set({ motionPermission: v }),
      setPreferredMusicStyle: (v) => set({ preferredMusicStyle: v }),
    }),
    { name: 'calmwave-app' },
  ),
);
