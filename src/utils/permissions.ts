import type { PermissionStatus } from '../types';

export async function requestMotionPermission(): Promise<PermissionStatus> {
  // Check if DeviceMotionEvent exists
  if (typeof DeviceMotionEvent === 'undefined') {
    return 'unavailable';
  }

  // iOS 13+ requires explicit permission request
  if (
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  ) {
    try {
      const result = await (
        DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }
      ).requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }

  // Non-iOS or older browsers — permission is implicit
  return 'granted';
}

export function isSecureContext(): boolean {
  return window.isSecureContext;
}

export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if ('wakeLock' in navigator) {
    try {
      return await navigator.wakeLock.request('screen');
    } catch {
      return null;
    }
  }
  return null;
}
