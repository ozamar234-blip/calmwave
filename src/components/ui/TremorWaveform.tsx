import { useRef, useEffect, useCallback } from 'react';

interface TremorWaveformProps {
  /** Live acceleration samples {x,y,z} — latest at end */
  samples: { x: number; y: number; z: number }[];
  /** 0-1 normalized intensity */
  intensity: number;
  width?: number;
  height?: number;
}

function getWaveColor(intensity: number): string {
  if (intensity > 0.6) return '#ef4444';
  if (intensity > 0.3) return '#f59e0b';
  return '#6366f1';
}

function getGlowColor(intensity: number): string {
  if (intensity > 0.6) return 'rgba(239, 68, 68, 0.7)';
  if (intensity > 0.3) return 'rgba(245, 158, 11, 0.6)';
  return 'rgba(99, 102, 241, 0.5)';
}

/**
 * Real-time seismograph that draws live accelerometer data.
 * Extremely sensitive to any motion — the waveform reacts immediately.
 */
export function TremorWaveform({
  samples,
  intensity,
  width = 320,
  height = 120,
}: TremorWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const samplesRef = useRef(samples);
  const intensityRef = useRef(intensity);

  // Always point to the latest refs (samples is same array, mutated in place)
  samplesRef.current = samples;
  intensityRef.current = intensity;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = width * dpr;
    const h = height * dpr;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    const curSamples = samplesRef.current;
    const curIntensity = intensityRef.current;
    const color = getWaveColor(curIntensity);
    const glow = getGlowColor(curIntensity);

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 0.5 * dpr;
    for (let i = 1; i <= 3; i++) {
      const y1 = h / 2 - (h / 8) * i;
      const y2 = h / 2 + (h / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y1);
      ctx.lineTo(w, y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y2);
      ctx.lineTo(w, y2);
      ctx.stroke();
    }

    if (curSamples.length < 2) {
      // Draw "waiting" animation — subtle sine wave
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      const t = Date.now() / 1000;
      for (let i = 0; i < w; i++) {
        const x = i;
        const y = h / 2 + Math.sin((i / w) * Math.PI * 4 + t * 2) * 5 * dpr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Use last N samples to fill the width
    const displayCount = Math.min(curSamples.length, 200);
    const recent = curSamples.slice(-displayCount);

    // Show magnitude for maximum sensitivity
    const values = recent.map(
      (s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z),
    );

    // Dynamic scaling for maximum visual impact
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const effectiveRange = Math.max(range, 0.005);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const stepX = w / (displayCount - 1);

    // Glow effect
    ctx.shadowColor = glow;
    ctx.shadowBlur = (6 + curIntensity * 20) * dpr;

    // Filled area under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `${color}30`);
    gradient.addColorStop(0.5, `${color}08`);
    gradient.addColorStop(1, `${color}30`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    for (let i = 0; i < values.length; i++) {
      const x = i * stepX;
      const deviation = (values[i] - avg) / effectiveRange;
      const amplified = deviation * (2 + curIntensity * 3);
      const y = h / 2 - amplified * (h / 2) * 0.8;
      const clamped = Math.max(4 * dpr, Math.min(h - 4 * dpr, y));
      if (i === 0) ctx.moveTo(x, clamped);
      else ctx.lineTo(x, clamped);
    }
    ctx.lineTo((values.length - 1) * stepX, h / 2);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fill();

    // Main line — thicker with more motion
    ctx.strokeStyle = color;
    ctx.lineWidth = (1.5 + curIntensity * 2.5) * dpr;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const x = i * stepX;
      const deviation = (values[i] - avg) / effectiveRange;
      const amplified = deviation * (2 + curIntensity * 3);
      const y = h / 2 - amplified * (h / 2) * 0.8;
      const clamped = Math.max(4 * dpr, Math.min(h - 4 * dpr, y));
      if (i === 0) ctx.moveTo(x, clamped);
      else ctx.lineTo(x, clamped);
    }
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Current value marker — pulsing dot
    const lastVal = values[values.length - 1];
    const lastDev = (lastVal - avg) / effectiveRange;
    const lastAmp = lastDev * (2 + curIntensity * 3);
    const lastY = Math.max(4 * dpr, Math.min(h - 4 * dpr,
      h / 2 - lastAmp * (h / 2) * 0.8));
    const lastX = (values.length - 1) * stepX;

    const pulseSize = (4 + curIntensity * 4 + Math.sin(Date.now() / 200) * 1.5) * dpr;
    ctx.beginPath();
    ctx.arc(lastX, lastY, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, pulseSize * 1.8, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}50`;
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    animRef.current = requestAnimationFrame(draw);
  }, [width, height]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
  );
}
