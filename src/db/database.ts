import Dexie, { type EntityTable } from 'dexie';
import type { CalibrationData, SessionData } from '../types';

const db = new Dexie('CalmWaveDB') as Dexie & {
  sessions: EntityTable<SessionData, 'id'>;
  calibration: EntityTable<CalibrationData & { id?: number }, 'id'>;
};

db.version(1).stores({
  sessions: 'id, startTime, endTime',
  calibration: '++id, timestamp',
});

export { db };

export async function saveSession(session: SessionData): Promise<void> {
  await db.sessions.add(session);
}

export async function getSessions(limit = 50): Promise<SessionData[]> {
  return db.sessions.orderBy('startTime').reverse().limit(limit).toArray();
}

export async function getSessionsByDateRange(
  from: number,
  to: number,
): Promise<SessionData[]> {
  return db.sessions.where('startTime').between(from, to).toArray();
}

export async function saveCalibration(data: CalibrationData): Promise<void> {
  await db.calibration.clear();
  await db.calibration.add(data);
}

export async function getCalibration(): Promise<CalibrationData | undefined> {
  const all = await db.calibration.toArray();
  return all[0];
}

export async function clearAllData(): Promise<void> {
  await db.sessions.clear();
  await db.calibration.clear();
}
