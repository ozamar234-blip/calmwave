import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeviceMotion } from '../../hooks/useDeviceMotion';
import { useStressAnalysis } from '../../hooks/useStressAnalysis';
import { useCalibration } from '../../hooks/useCalibration';
import { MEASUREMENT_DURATION } from '../../utils/constants';
import { TremorWaveform } from '../ui/TremorWaveform';
import { TremorGauge } from '../ui/TremorGauge';
import { TremorPulse } from '../ui/TremorPulse';
import { Button } from '../ui/Button';
import type { StressResult } from '../../types';

/**
 * Compute live intensity (0-1) from recent samples.
 * Uses standard deviation of magnitude — very sensitive to any movement.
 * With gravity removed, resting hand gives ~0.01-0.05, shaking gives 0.5-5+
 */
function computeLiveIntensity(
  samples: { x: number; y: number; z: number }[],
): number {
  if (samples.length < 5) return 0;
  const recent = samples.slice(-60); // Use more samples for stability
  const magnitudes = recent.map(
    (s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z),
  );
  const avg = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const variance =
    magnitudes.reduce((a, m) => a + (m - avg) ** 2, 0) / magnitudes.length;
  const std = Math.sqrt(variance);

  // After gravity removal:
  // - Resting hand: std ~0.005-0.02
  // - Light tremor:  std ~0.02-0.1
  // - Moderate shake: std ~0.1-0.5
  // - Strong shake:   std ~0.5+
  // Map with a low threshold for high sensitivity
  const normalized = Math.min(1, std / 0.3);

  // Also factor in average magnitude (direct movement detection)
  const avgNorm = Math.min(1, avg / 0.5);

  // Combine both signals
  return Math.min(1, Math.max(normalized, avgNorm));
}

export function MeasurementScreen() {
  const navigate = useNavigate();
  const {
    samples,
    startListening,
    stopListening,
    clearBuffer,
    permission,
    requestPermission,
    liveAccel,
  } = useDeviceMotion();
  const { analyze } = useStressAnalysis();
  const { calibration, loadCalibration } = useCalibration();
  const [phase, setPhase] = useState<'prep' | 'measuring' | 'result'>('prep');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StressResult | null>(null);
  const [liveIntensity, setLiveIntensity] = useState(0);
  const [peakIntensity, setPeakIntensity] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const intensityRef = useRef<number | null>(null);

  useEffect(() => {
    loadCalibration();
  }, [loadCalibration]);

  // Memoize samples ref for closures
  const samplesArrayRef = useRef(samples);
  samplesArrayRef.current = samples;

  const startMeasurement = useCallback(async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    clearBuffer();
    startListening();
    setPhase('measuring');
    setLiveIntensity(0);
    setPeakIntensity(0);
    setSampleCount(0);

    const start = Date.now();
    const duration = MEASUREMENT_DURATION * 1000;

    // Progress timer
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      setSampleCount(samplesArrayRef.current.length);

      if (p >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (intensityRef.current) clearInterval(intensityRef.current);
        stopListening();

        // Use samplesArrayRef for latest data (avoids stale closure)
        const currentSamples = [...samplesArrayRef.current];
        if (calibration && currentSamples.length > 64) {
          const stressResult = analyze(currentSamples, calibration);
          setResult(stressResult);
        } else {
          // No calibration or insufficient samples — estimate from intensity
          const finalIntensity = computeLiveIntensity(currentSamples);
          const estimatedScore = Math.max(1, Math.min(10, Math.round(1 + finalIntensity * 9)));
          setResult({
            score: estimatedScore,
            rms: finalIntensity * 0.5,
            bandPower: finalIntensity * 0.3,
            timestamp: Date.now(),
          });
        }
        setPhase('result');
      }
    }, 100);

    // Live intensity update — fast for responsive visualization
    intensityRef.current = window.setInterval(() => {
      // Use ref to always get latest samples (same array reference)
      const intensity = computeLiveIntensity(samplesArrayRef.current);
      setLiveIntensity(intensity);
      setPeakIntensity(prev => Math.max(prev, intensity));
      setSampleCount(samplesArrayRef.current.length);
    }, 50); // 20fps updates for smooth animation
  }, [permission, requestPermission, clearBuffer, startListening, stopListening, analyze, calibration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (intensityRef.current) clearInterval(intensityRef.current);
      stopListening();
    };
  }, [stopListening]);

  const getFeedback = (score: number): string => {
    if (score <= 3) return 'רגוע/ה 😌 — המשך כך!';
    if (score <= 6) return 'לחץ בינוני 😐 — בוא נעזור לך להירגע';
    return 'לחץ גבוה 😰 — המוזיקה כבר בדרך';
  };

  const secondsLeft = Math.ceil(MEASUREMENT_DURATION * (1 - progress));

  const responsiveWidth = useMemo(
    () => Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 48 : 320),
    [],
  );

  // Format live values for display
  const formatAccel = (v: number) => Math.abs(v) < 0.001 ? '0.000' : v.toFixed(3);

  return (
    <div className="screen-center px-6 bg-gradient-to-b from-bg-primary to-bg-secondary safe-area-top safe-area-bottom">
      <AnimatePresence mode="wait">
        {/* ─── PREP PHASE ─── */}
        {phase === 'prep' && (
          <motion.div
            key="prep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex flex-col items-center gap-5 max-w-sm px-2"
          >
            <div className="text-6xl leading-none">🤲</div>
            <h1 className="text-2xl font-bold">מדידת לחץ</h1>
            <p className="text-text-secondary text-base leading-relaxed">
              החזק/י את הטלפון ביד למשך {MEASUREMENT_DURATION} שניות.
              <br />
              אנחנו נמדוד את רמת הרעד שלך.
            </p>
            <Button
              onClick={startMeasurement}
              size="lg"
              className="w-full max-w-xs"
              aria-label="התחל מדידה"
            >
              התחל מדידה
            </Button>
          </motion.div>
        )}

        {/* ─── MEASURING PHASE — with live tremor viz ─── */}
        {phase === 'measuring' && (
          <motion.div
            key="measuring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex flex-col items-center gap-3 w-full max-w-sm"
          >
            {/* Live Tremor Pulse — shakes with motion */}
            <TremorPulse intensity={liveIntensity} size={130} />

            {/* Timer + intensity label */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums" style={{
                color: liveIntensity > 0.6 ? '#ef4444' : liveIntensity > 0.3 ? '#f59e0b' : '#6366f1',
              }}>
                {secondsLeft}
              </span>
              <span className="text-text-secondary text-sm">שניות</span>
            </div>

            {/* Live Seismograph */}
            <div className="w-full flex flex-col items-center gap-1">
              <p className="text-xs text-text-secondary">סייסמוגרף חי — רעידות בזמן אמת</p>
              <TremorWaveform
                samples={samples}
                intensity={liveIntensity}
                width={responsiveWidth}
                height={100}
              />
            </div>

            {/* Intensity Bar */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                <span>רגוע</span>
                <span>עוצמת רעד: {Math.round(liveIntensity * 100)}%</span>
                <span>גבוה</span>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  animate={{
                    width: `${Math.max(3, liveIntensity * 100)}%`,
                    backgroundColor:
                      liveIntensity > 0.6
                        ? '#ef4444'
                        : liveIntensity > 0.3
                          ? '#f59e0b'
                          : '#6366f1',
                  }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                  style={{
                    boxShadow:
                      liveIntensity > 0.3
                        ? `0 0 12px ${liveIntensity > 0.6 ? '#ef444480' : '#f59e0b80'}`
                        : 'none',
                  }}
                />
              </div>
            </div>

            {/* Live sensor data — proves the sensor is working */}
            <div className="w-full max-w-xs flex gap-2 justify-center">
              <div className="glass px-2 py-1 text-center flex-1">
                <div className="text-[9px] opacity-50">X</div>
                <div className="font-mono text-xs" style={{
                  color: Math.abs(liveAccel.x) > 0.1 ? '#f59e0b' : '#6366f1'
                }}>{formatAccel(liveAccel.x)}</div>
              </div>
              <div className="glass px-2 py-1 text-center flex-1">
                <div className="text-[9px] opacity-50">Y</div>
                <div className="font-mono text-xs" style={{
                  color: Math.abs(liveAccel.y) > 0.1 ? '#f59e0b' : '#6366f1'
                }}>{formatAccel(liveAccel.y)}</div>
              </div>
              <div className="glass px-2 py-1 text-center flex-1">
                <div className="text-[9px] opacity-50">Z</div>
                <div className="font-mono text-xs" style={{
                  color: Math.abs(liveAccel.z) > 0.1 ? '#f59e0b' : '#6366f1'
                }}>{formatAccel(liveAccel.z)}</div>
              </div>
              <div className="glass px-2 py-1 text-center flex-1">
                <div className="text-[9px] opacity-50">דגימות</div>
                <div className="font-mono text-xs text-accent-calm">{sampleCount}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress * 100}%`,
                    background: 'rgba(99, 102, 241, 0.6)',
                  }}
                />
              </div>
              <p className="text-text-secondary text-xs mt-1">
                {sampleCount > 0 ? 'מזהה תנועה...' : 'ממתין לחיישן...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── RESULT PHASE — with gauge ─── */}
        {phase === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex flex-col items-center gap-4 max-w-sm w-full px-2"
          >
            {/* Animated Gauge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <TremorGauge
                intensity={result.score / 10}
                label="ציון לחץ"
                size={Math.min(240, responsiveWidth)}
              />
            </motion.div>

            {/* Feedback text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-text-secondary"
            >
              {getFeedback(result.score)}
            </motion.p>

            {/* RMS + Band Power + Peak detail */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-3 text-xs text-text-secondary"
            >
              <div className="glass px-3 py-2 text-center">
                <div className="text-[10px] opacity-60">RMS</div>
                <div className="font-mono">{result.rms.toFixed(4)}</div>
              </div>
              <div className="glass px-3 py-2 text-center">
                <div className="text-[10px] opacity-60">Band Power</div>
                <div className="font-mono">{result.bandPower.toFixed(4)}</div>
              </div>
              <div className="glass px-3 py-2 text-center">
                <div className="text-[10px] opacity-60">שיא</div>
                <div className="font-mono">{Math.round(peakIntensity * 100)}%</div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col gap-3 w-full mt-2"
            >
              <Button
                onClick={() =>
                  navigate('/relaxation', {
                    state: { stressScore: result.score },
                  })
                }
                size="lg"
                className="w-full"
                aria-label="התחל הרגעה"
              >
                🎵 התחל הרגעה
              </Button>
              <Button
                onClick={startMeasurement}
                variant="secondary"
                size="md"
                className="w-full"
                aria-label="מדוד שוב"
              >
                🔄 מדוד שוב
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="md"
                className="w-full"
                aria-label="חזרה לראשי"
              >
                חזרה לראשי
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
