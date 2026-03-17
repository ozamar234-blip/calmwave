import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToneEngine } from '../../hooks/useToneEngine';
import { useSessionManager } from '../../hooks/useSessionManager';
import { useSessionStore } from '../../stores/sessionStore';
import { requestWakeLock } from '../../utils/permissions';
import { PASSIVE_UPDATE_INTERVAL } from '../../utils/constants';
import { BreathingVisual } from '../breathing/BreathingVisual';
import { Timer } from '../ui/Timer';
import { Button } from '../ui/Button';

export function RelaxationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const stressScore = (location.state as { stressScore?: number })?.stressScore ?? 5;

  const engine = useToneEngine();
  const session = useSessionManager();
  const { currentBpm, currentScore, elapsed, active } = useSessionStore();
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [started, setStarted] = useState(false);
  const tickRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const handleStart = useCallback(async () => {
    const { startBpm, targetBpm, transitionSeconds } = session.startSession(stressScore);
    await engine.start(startBpm, 'calm');
    engine.rampTo(targetBpm, transitionSeconds);
    engine.updateStress(stressScore);

    wakeLockRef.current = await requestWakeLock();
    setStarted(true);
  }, [engine, session, stressScore]);

  // Tick timer every second
  useEffect(() => {
    if (!started || !active) return;
    tickRef.current = window.setInterval(() => {
      session.tick();

      // Update BPM display
      const bpm = engine.getBpm();
      useSessionStore.getState().updateBpm(bpm);

      // Simulate passive stress decrease over time
      const state = useSessionStore.getState();
      if (state.elapsed > 0 && state.elapsed % PASSIVE_UPDATE_INTERVAL === 0) {
        const decay = Math.max(1, state.currentScore - 0.3);
        const newScore = Math.round(decay * 10) / 10;
        if (newScore !== state.currentScore) {
          useSessionStore.getState().updateScore(Math.round(newScore));
          engine.updateStress(Math.round(newScore));
        }
      }

      // Check auto-end
      if (session.shouldAutoEnd()) {
        handleEnd();
      }

      // Show "you're relaxed" message
      if (useSessionStore.getState().currentScore <= 3 && !showEndMessage) {
        setShowEndMessage(true);
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [started, active, engine, session, showEndMessage]);

  const handleEnd = useCallback(() => {
    engine.stop();
    session.endSession();
    wakeLockRef.current?.release();
    navigate('/summary', {
      state: {
        initialScore: stressScore,
        finalScore: useSessionStore.getState().currentScore || 1,
        duration: useSessionStore.getState().elapsed,
        scores: useSessionStore.getState().scores,
      },
    });
  }, [engine, session, navigate, stressScore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.stop();
      wakeLockRef.current?.release();
    };
  }, [engine]);

  // Background gradient based on stress
  const bgGradient =
    currentScore >= 7
      ? 'from-bg-primary via-red-950/30 to-bg-primary'
      : currentScore >= 4
        ? 'from-bg-primary via-orange-950/20 to-bg-primary'
        : 'from-bg-primary via-blue-950/30 to-bg-primary';

  if (!started) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-bg-primary to-bg-secondary">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center flex flex-col items-center gap-6 max-w-sm"
        >
          <h1 className="text-2xl font-bold">מוכן/ה להתחיל?</h1>
          <p className="text-text-secondary">
            הנח/י את הטלפון על משטח יציב. המוזיקה תתחיל ותוביל אותך להירגע.
          </p>
          <p className="text-accent-calm text-sm">
            ציון הלחץ שלך: {stressScore}/10
          </p>
          <Button onClick={handleStart} size="round" className="pulse-glow" aria-label="התחל הרגעה">
            <span className="text-2xl">▶</span>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-b ${bgGradient} transition-all duration-[5000ms]`}>
      {/* Top: BPM + Timer */}
      <div className="flex justify-between w-full max-w-sm">
        <div className="glass px-4 py-2 text-center">
          <div className="text-xs text-text-secondary">BPM</div>
          <div className="text-lg font-bold text-accent-calm">{Math.round(currentBpm)}</div>
        </div>
        <div className="glass px-4 py-2 text-center">
          <Timer seconds={elapsed} className="text-lg font-bold" />
        </div>
        <div className="glass px-4 py-2 text-center">
          <div className="text-xs text-text-secondary">לחץ</div>
          <div className="text-lg font-bold">{currentScore}/10</div>
        </div>
      </div>

      {/* Center: Breathing */}
      <div className="flex-1 flex items-center justify-center">
        <BreathingVisual currentBpm={currentBpm} stressScore={currentScore} />
      </div>

      {/* "You're relaxed" message */}
      {showEndMessage && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-accent-success text-lg font-medium mb-4"
        >
          נראה שנרגעת 🙂
        </motion.p>
      )}

      {/* Bottom: End button */}
      <Button onClick={handleEnd} variant="secondary" size="md" aria-label="סיים הרגעה">
        סיים
      </Button>
    </div>
  );
}
