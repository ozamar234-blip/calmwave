import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeviceMotion } from '../../hooks/useDeviceMotion';
import { useStressAnalysis } from '../../hooks/useStressAnalysis';
import { useCalibration } from '../../hooks/useCalibration';
import { MEASUREMENT_DURATION } from '../../utils/constants';
import { ProgressRing } from '../ui/ProgressRing';
import { ScoreDisplay } from '../ui/ScoreDisplay';
import { Button } from '../ui/Button';
import type { StressResult } from '../../types';

export function MeasurementScreen() {
  const navigate = useNavigate();
  const { samples, startListening, stopListening, clearBuffer, permission, requestPermission } = useDeviceMotion();
  const { analyze } = useStressAnalysis();
  const { calibration, loadCalibration } = useCalibration();
  const [phase, setPhase] = useState<'prep' | 'measuring' | 'result'>('prep');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StressResult | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadCalibration();
  }, [loadCalibration]);

  const startMeasurement = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    clearBuffer();
    startListening();
    setPhase('measuring');

    const start = Date.now();
    const duration = MEASUREMENT_DURATION * 1000;

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        stopListening();

        if (calibration) {
          const stressResult = analyze([...samples], calibration);
          setResult(stressResult);
        } else {
          setResult({ score: 5, rms: 0, bandPower: 0, timestamp: Date.now() });
        }
        setPhase('result');
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopListening();
    };
  }, [stopListening]);

  const getFeedback = (score: number): string => {
    if (score <= 3) return 'רגוע/ה 😌 — המשך כך!';
    if (score <= 6) return 'לחץ בינוני 😐 — בוא נעזור לך להירגע';
    return 'לחץ גבוה 😰 — המוזיקה כבר בדרך';
  };

  return (
    <div className="screen items-center justify-center px-6 bg-gradient-to-b from-bg-primary to-bg-secondary safe-area-top safe-area-bottom">
      <AnimatePresence mode="wait">
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
              החזק/י את הטלפון ביד למשך {MEASUREMENT_DURATION} שניות. אנחנו נמדוד את רמת הרעד.
            </p>
            <Button onClick={startMeasurement} size="lg" className="w-full max-w-xs" aria-label="התחל מדידה">
              התחל מדידה
            </Button>
          </motion.div>
        )}

        {phase === 'measuring' && (
          <motion.div
            key="measuring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex flex-col items-center gap-5"
          >
            <ProgressRing progress={progress} size={200} color="#6366f1">
              <span className="text-3xl font-bold">{Math.ceil(MEASUREMENT_DURATION * (1 - progress))}</span>
            </ProgressRing>
            <h2 className="text-xl font-semibold">מודד/ת...</h2>
            <p className="text-text-secondary text-sm">החזק/י את הטלפון ביד בצורה טבעית</p>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex flex-col items-center gap-5 max-w-sm w-full px-2"
          >
            <ScoreDisplay score={result.score} />
            <p className="text-lg text-text-secondary">{getFeedback(result.score)}</p>

            <div className="flex flex-col gap-3 w-full mt-2">
              <Button
                onClick={() => navigate('/relaxation', { state: { stressScore: result.score } })}
                size="lg"
                className="w-full"
                aria-label="התחל הרגעה"
              >
                התחל הרגעה
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
