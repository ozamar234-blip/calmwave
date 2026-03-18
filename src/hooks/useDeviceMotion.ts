import { useCallback, useEffect, useRef, useState } from 'react';
import type { PermissionStatus } from '../types';
import { requestMotionPermission } from '../utils/permissions';
import { BUFFER_SIZE } from '../utils/constants';

interface UseDeviceMotionReturn {
  permission: PermissionStatus;
  requestPermission: () => Promise<PermissionStatus>;
  /** Always the same array reference — mutated in place */
  samples: { x: number; y: number; z: number }[];
  rotationSamples: { alpha: number; beta: number; gamma: number }[];
  isListening: boolean;
  /** Latest raw magnitude (for instant UI feedback) */
  liveMagnitude: number;
  /** Latest raw acceleration (gravity-removed) */
  liveAccel: { x: number; y: number; z: number };
  startListening: () => void;
  stopListening: () => void;
  clearBuffer: () => void;
}

/**
 * High-pass filter to remove gravity from accelerationIncludingGravity.
 * Uses exponential moving average as a simple gravity estimator.
 * Alpha ~0.8 means we respond to quick changes (tremor) while filtering slow ones (gravity).
 */
const GRAVITY_ALPHA = 0.8;

export function useDeviceMotion(): UseDeviceMotionReturn {
  const [permission, setPermission] = useState<PermissionStatus>('prompt');
  const [isListening, setIsListening] = useState(false);
  const [liveMagnitude, setLiveMagnitude] = useState(0);
  const [liveAccel, setLiveAccel] = useState({ x: 0, y: 0, z: 0 });

  // IMPORTANT: We use a stable array reference and mutate it in place (splice/push)
  // so that closures in setInterval etc. always see latest data
  const samplesRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const rotationRef = useRef<{ alpha: number; beta: number; gamma: number }[]>([]);
  const [, forceUpdate] = useState(0);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // Gravity estimation for high-pass filter
  const gravityRef = useRef({ x: 0, y: 0, z: 0 });
  const hasGravityEstimate = useRef(false);

  // Track sample count for fast UI updates
  const sampleCountRef = useRef(0);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    let x = 0, y = 0, z = 0;

    // Prefer acceleration (already gravity-free)
    const acc = event.acceleration;
    const accG = event.accelerationIncludingGravity;

    if (acc && acc.x != null && acc.y != null && acc.z != null &&
        (Math.abs(acc.x) > 0.0001 || Math.abs(acc.y) > 0.0001 || Math.abs(acc.z) > 0.0001)) {
      // Has real acceleration data (not all zeros)
      x = acc.x;
      y = acc.y;
      z = acc.z;
    } else if (accG && accG.x != null && accG.y != null && accG.z != null) {
      // Fall back to accelerationIncludingGravity — must remove gravity
      const rawX = accG.x;
      const rawY = accG.y;
      const rawZ = accG.z;

      if (!hasGravityEstimate.current) {
        // Initialize gravity estimate with first reading
        gravityRef.current = { x: rawX, y: rawY, z: rawZ };
        hasGravityEstimate.current = true;
      }

      // Exponential moving average to estimate gravity
      const g = gravityRef.current;
      g.x = GRAVITY_ALPHA * g.x + (1 - GRAVITY_ALPHA) * rawX;
      g.y = GRAVITY_ALPHA * g.y + (1 - GRAVITY_ALPHA) * rawY;
      g.z = GRAVITY_ALPHA * g.z + (1 - GRAVITY_ALPHA) * rawZ;

      // Remove gravity to get linear acceleration
      x = rawX - g.x;
      y = rawY - g.y;
      z = rawZ - g.z;
    }

    // Push sample — use in-place mutation to keep reference stable
    samplesRef.current.push({ x, y, z });

    // Trim buffer using splice (keeps same array reference!)
    if (samplesRef.current.length > BUFFER_SIZE) {
      samplesRef.current.splice(0, samplesRef.current.length - BUFFER_SIZE);
    }

    // Track rotation
    const rot = event.rotationRate;
    if (rot) {
      const alpha = rot.alpha ?? 0;
      const beta = rot.beta ?? 0;
      const gamma = rot.gamma ?? 0;
      rotationRef.current.push({ alpha, beta, gamma });
      if (rotationRef.current.length > BUFFER_SIZE) {
        rotationRef.current.splice(0, rotationRef.current.length - BUFFER_SIZE);
      }
    }

    // Update live values every 3 samples for responsive UI
    sampleCountRef.current++;
    if (sampleCountRef.current % 3 === 0) {
      const mag = Math.sqrt(x * x + y * y + z * z);
      setLiveMagnitude(mag);
      setLiveAccel({ x, y, z });
    }
  }, []);

  const doRequestPermission = useCallback(async () => {
    const status = await requestMotionPermission();
    setPermission(status);
    return status;
  }, []);

  const startListening = useCallback(() => {
    if (permission !== 'granted') return;
    // Prevent duplicate listeners
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current);
    }
    // Reset gravity estimate
    hasGravityEstimate.current = false;
    gravityRef.current = { x: 0, y: 0, z: 0 };
    sampleCountRef.current = 0;

    listenerRef.current = handleMotion;
    window.addEventListener('devicemotion', handleMotion, { passive: true });
    setIsListening(true);
  }, [permission, handleMotion]);

  const stopListening = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current);
      listenerRef.current = null;
    }
    setIsListening(false);
  }, []);

  const clearBuffer = useCallback(() => {
    // Clear in place — keep same array reference
    samplesRef.current.length = 0;
    rotationRef.current.length = 0;
    sampleCountRef.current = 0;
    hasGravityEstimate.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('devicemotion', listenerRef.current);
      }
    };
  }, []);

  // Force re-render periodically for components reading samples
  useEffect(() => {
    if (!isListening) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 150);
    return () => clearInterval(id);
  }, [isListening]);

  return {
    permission,
    requestPermission: doRequestPermission,
    samples: samplesRef.current,
    rotationSamples: rotationRef.current,
    isListening,
    liveMagnitude,
    liveAccel,
    startListening,
    stopListening,
    clearBuffer,
  };
}
