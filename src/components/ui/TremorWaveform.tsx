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
  if (intensity > 0.7) return '#ef4444';
  if (intensity > 0.4) return '#f59e0b';
  return '#6366f1';
}

function getGlowColor(intensity: number): string {
  if (intensity > 0.7) return 'rgba(239, 68, 68, 0.6)';
  if (intensity > 0.4) return 'rgba(245, 158, 11, 0.5)';
  return 'rgba(99, 102, 241, 0.4)';
}

/**
 * Real-time seismograph / waveform that draws live accelerometer magnitude data.
 * Uses canvas for smooth 60fps rendering.
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    // Use last N samples to fill the width
    const displayCount = Math.min(curSamples.length, 180);
    const recent = curSamples.slice(-displayCount);

    // Compute magnitudes
    const magnitudes = recent.map(
      (s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z),
    );

    // Find a reasonable max for scaling (use dynamic range based on data)
    const avg = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    const maxMag = Math.max(avg * 3, 2); // At least 2 m/s²

    const stepX = w / (displayCount - 1);

    // Glow effect
    ctx.shadowColor = glow;
    ctx.shadowBlur = 8 * dpr * (0.5 + curIntensity);

    // Draw filled area
    ctx.fillStyle = `${color}15`;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    for (let i = 0; i < magnitudes.length; i++) {
      const x = i * stepX;
      const normalized = ((magnitudes[i] - avg) / maxMag);
      const y = h / 2 - normalized * (h / 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo((magnitudes.length - 1) * stepX, h / 2);
    ctx.lineTo(0, h / 2);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = (1.5 + curIntensity * 1.5) * dpr;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < magnitudes.length; i++) {
      const x = i * stepX;
      const normalized = ((magnitudes[i] - avg) / maxMag);
      const y = h / 2 - normalized * (h / 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw current value marker (right edge dot)
    const lastMag = magnitudes[magnitudes.length - 1];
    const lastNorm = ((lastMag - avg) / maxMag);
    const lastY = h / 2 - lastNorm * (h / 2) * 0.85;
    const lastX = (magnitudes.length - 1) * stepX;

    ctx.beginPath();
    ctx.arc(lastX, lastY, (3 + curIntensity * 3) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Outer pulse on marker
    ctx.beginPath();
    ctx.arc(lastX, lastY, (6 + curIntensity * 6) * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}60`;
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
