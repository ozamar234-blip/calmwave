import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  const endedRef = useRef(false);

  const handleEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;

    engine.stop();
    const state = useSessionStore.getState();
    const finalScore = state.currentScore || 1;
    const duration = state.elapsed;
    const scores = [...state.scores];
    session.endSession();
    wakeLockRef.current?.release();

    navigate('/summary', {
      state: { initialScore: stressScore, finalScore, duration, scores },
    });
  }, [engine, session, navigate, stressScore]);

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

      const bpm = engine.getBpm();
      useSessionStore.getState().updateBpm(bpm);

      const state = useSessionStore.getState();
      if (state.elapsed > 0 && state.elapsed % PASSIVE_UPDATE_INTERVAL === 0) {
        const decay = Math.max(1, state.currentScore - 0.3);
        const newScore = Math.round(decay * 10) / 10;
        if (newScore !== state.currentScore) {
          useSessionStore.getState().updateScore(Math.round(newScore));
          engine.updateStress(Math.round(newScore));
        }
      }

      if (session.shouldAutoEnd()) {
        handleEnd();
      }

      if (useSessionStore.getState().currentScore <= 3 && !showEndMessage) {
        setShowEndMessage(true);
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [started, active, engine, session, showEndMessage, handleEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.stop();
      wakeLockRef.current?.release();
    };
  }, [engine]);

  // Dynamic background color
  const getBgStyle = () => {
    if (currentScore >= 7) return { background: 'linear-gradient(to bottom, #0f0a1e, #1a0a0a, #0f0a1e)' };
    if (currentScore >= 4) return { background: 'linear-gradient(to bottom, #0f0a1e, #1a1005, #0f0a1e)' };
    return { background: 'linear-gradient(to bottom, #0f0a1e, #0a0f1e, #0f0a1e)' };
  };

  // Score bar color
  const getScoreColor = (score: number): string => {
    if (score >= 7) return '#ef4444';
    if (score >= 4) return '#f59e0b';
    return '#10b981';
  };

  const scoreColor = getScoreColor(currentScore);

  // BPM progress towards target
  const bpmProgress = useMemo(() => {
    const startBpm = stressScore >= 7 ? 115 : stressScore >= 4 ? 90 : 75;
    const targetBpm = 65;
    const range = startBpm - targetBpm;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, (startBpm - currentBpm) / range));
  }, [currentBpm, stressScore]);

  if (!started) {
    return (
      <div className="screen items-center justify-center px-6 bg-gradient-to-b from-bg-primary to-bg-secondary safe-area-top safe-area-bottom">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center flex flex-col items-center gap-5 max-w-sm px-2"
        >
          <h1 className="text-2xl font-bold">מוכן/ה להתחיל?</h1>
          <p className="text-text-secondary text-base leading-relaxed">
            הנח/י את הטלפון על משטח יציב. המוזיקה תתחיל ותוביל אותך להירגע.
          </p>

          {/* Score preview with visual bar */}
          <div className="glass-card w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-text-secondary">ציון הלחץ שלך</span>
              <span className="text-2xl font-bold" style={{ color: getScoreColor(stressScore) }}>
                {stressScore}/10
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stressScore * 10}%`,
                  background: getScoreColor(stressScore),
                  boxShadow: `0 0 8px ${getScoreColor(stressScore)}60`,
                }}
              />
            </div>
          </div>

          <Button onClick={handleStart} size="round" className="pulse-glow mt-2" aria-label="התחל הרגעה">
            <span className="text-3xl">▶</span>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="screen items-center justify-between py-8 px-5 safe-area-top safe-area-bottom"
      style={{ ...getBgStyle(), transition: 'background 5s ease' }}
    >
      {/* Top: Enhanced stats bar */}
      <div className="flex flex-col w-full max-w-sm gap-2">
        <div className="flex justify-between w-full gap-2">
          <div className="glass px-3 py-2 text-center flex-1">
            <div className="text-[10px] text-text-secondary leading-none">BPM</div>
            <div className="text-base font-bold text-accent-calm mt-0.5">{Math.round(currentBpm)}</div>
          </div>
          <div className="glass px-3 py-2 text-center flex-1">
            <div className="text-[10px] text-text-secondary leading-none">זמן</div>
            <Timer seconds={elapsed} className="text-base font-bold mt-0.5 block" />
          </div>
          <div className="glass px-3 py-2 text-center flex-1">
            <div className="text-[10px] text-text-secondary leading-none">לחץ</div>
            <div className="text-base font-bold mt-0.5" style={{ color: scoreColor }}>
              {currentScore}/10
            </div>
          </div>
        </div>

        {/* Stress reduction progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-[9px] text-text-secondary mb-0.5 px-1">
            <span>לחץ</span>
            <span>התקדמות הרגעה</span>
            <span>רגוע</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{
                width: `${Math.max(5, (1 - currentScore / 10) * 100)}%`,
              }}
              transition={{ duration: 1.5 }}
              style={{
                background: `linear-gradient(90deg, ${scoreColor}, #10b981)`,
                boxShadow: `0 0 6px #10b98160`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Center: Breathing */}
      <div className="flex-1 flex items-center justify-center py-4">
        <BreathingVisual currentBpm={currentBpm} stressScore={currentScore} />
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-3">
        {/* BPM ramp progress */}
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{Math.round(currentBpm)} BPM</span>
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full bg-accent-calm transition-all duration-1000"
              style={{ width: `${bpmProgress * 100}%` }}
            />
          </div>
          <span>65 BPM</span>
        </div>

        {/* "You're relaxed" message */}
        <div className="min-h-[40px] flex items-center">
          {showEndMessage && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-accent-success text-base font-medium"
            >
              נראה שנרגעת 🙂
            </motion.p>
          )}
        </div>

        {/* End button */}
        <Button onClick={handleEnd} variant="secondary" size="md" className="min-w-[120px]" aria-label="סיים הרגעה">
          סיים
        </Button>
      </div>
    </div>
  );
}
