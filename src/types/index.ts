export interface MotionData {
  timestamp: number;
  acceleration: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
}

export interface StressResult {
  score: number; // 1-10
  rms: number;
  bandPower: number;
  timestamp: number;
}

export interface CalibrationData {
  baselineRms: number;
  baselineBandPower: number;
  timestamp: number;
}

export interface SessionData {
  id: string;
  startTime: number;
  endTime: number;
  initialScore: number;
  finalScore: number;
  scores: { time: number; score: number }[];
  musicStyle: MusicStyle;
  duration: number; // seconds
}

export type MusicStyle = 'ambient-piano' | 'nature' | 'lofi-generative';

export type StressLevel = 'low' | 'medium' | 'high';

export interface BreathingState {
  phase: 'inhale' | 'exhale';
  cycleDuration: number; // seconds
  inhaleDuration: number;
  exhaleDuration: number;
}

export type AppScreen =
  | 'onboarding'
  | 'calibration'
  | 'dashboard'
  | 'measurement'
  | 'relaxation'
  | 'summary'
  | 'history'
  | 'settings';

export type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';
