import { useCallback, useEffect, useRef, useState } from 'react';
import type { PermissionStatus } from '../types';
import { requestMotionPermission } from '../utils/permissions';
import { BUFFER_SIZE } from '../utils/constants';

interface UseDeviceMotionReturn {
  permission: PermissionStatus;
  requestPermission: () => Promise<PermissionStatus>;
  samples: { x: number; y: number; z: number }[];
  rotationSamples: { alpha: number; beta: number; gamma: number }[];
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearBuffer: () => void;
}

export function useDeviceMotion(): UseDeviceMotionReturn {
  const [permission, setPermission] = useState<PermissionStatus>('prompt');
  const [isListening, setIsListening] = useState(false);
  const samplesRef = useRef<{ x: number; y: number; z: number }[]>([]);
  const rotationRef = useRef<{ alpha: number; beta: number; gamma: number }[]>([]);
  const [, forceUpdate] = useState(0);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    // Prefer acceleration without gravity; fall back to accelerationIncludingGravity on Safari
    const acc = event.acceleration ?? event.accelerationIncludingGravity;
    const rot = event.rotationRate;

    if (acc) {
      // On some Safari versions, values can be null individually
      const x = acc.x != null ? acc.x : 0;
      const y = acc.y != null ? acc.y : 0;
      const z = acc.z != null ? acc.z : 0;

      samplesRef.current.push({ x, y, z });
      if (samplesRef.current.length > BUFFER_SIZE) {
        samplesRef.current = samplesRef.current.slice(-BUFFER_SIZE);
      }
    }

    if (rot) {
      const alpha = rot.alpha != null ? rot.alpha : 0;
      const beta = rot.beta != null ? rot.beta : 0;
      const gamma = rot.gamma != null ? rot.gamma : 0;

      rotationRef.current.push({ alpha, beta, gamma });
      if (rotationRef.current.length > BUFFER_SIZE) {
        rotationRef.current = rotationRef.current.slice(-BUFFER_SIZE);
      }
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
    samplesRef.current = [];
    rotationRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('devicemotion', listenerRef.current);
      }
    };
  }, []);

  // Periodic state sync for consumers — less frequent to save battery
  useEffect(() => {
    if (!isListening) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 300);
    return () => clearInterval(id);
  }, [isListening]);

  return {
    permission,
    requestPermission: doRequestPermission,
    samples: samplesRef.current,
    rotationSamples: rotationRef.current,
    isListening,
    startListening,
    stopListening,
    clearBuffer,
  };
}
