import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useBreathingSync } from '../../hooks/useBreathingSync';

interface BreathingVisualProps {
  currentBpm: number;
  stressScore: number;
}

function getBreathColor(score: number): string {
  if (score >= 8) return '#ef4444';
  if (score >= 6) return '#f97316';
  if (score >= 4) return '#38bdf8';
  return '#7c3aed';
}

function getGradient(score: number): string {
  if (score >= 8) return 'radial-gradient(circle, #ef4444 0%, #f97316 100%)';
  if (score >= 6) return 'radial-gradient(circle, #f97316 0%, #38bdf8 100%)';
  if (score >= 4) return 'radial-gradient(circle, #38bdf8 0%, #6366f1 100%)';
  return 'radial-gradient(circle, #6366f1 0%, #7c3aed 100%)';
}

export function BreathingVisual({ currentBpm, stressScore }: BreathingVisualProps) {
  const { inhaleDuration, exhaleDuration } = useBreathingSync(currentBpm);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const controls = useAnimation();

  useEffect(() => {
    let cancelled = false;

    const runBreathCycle = async () => {
      while (!cancelled) {
        setPhase('inhale');
        await controls.start({
          scale: 1,
          opacity: 1,
          transition: { duration: inhaleDuration, ease: [0.4, 0, 0.2, 1] },
        });
        if (cancelled) break;

        setPhase('exhale');
        await controls.start({
          scale: 0.6,
          opacity: 0.7,
          transition: { duration: exhaleDuration, ease: [0.4, 0, 0.2, 1] },
        });
      }
    };

    runBreathCycle();
    return () => { cancelled = true; };
  }, [controls, inhaleDuration, exhaleDuration]);

  const color = getBreathColor(stressScore);
  const gradient = getGradient(stressScore);
  // Responsive size — smaller on small screens
  const size = Math.min(260, typeof window !== 'undefined' ? window.innerWidth * 0.6 : 260);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer glow — use WebKit filter for Safari */}
        <motion.div
          animate={controls}
          initial={{ scale: 0.6, opacity: 0.7 }}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            background: gradient,
            WebkitFilter: 'blur(40px)',
            filter: 'blur(40px)',
            opacity: 0.3,
            willChange: 'transform, opacity',
          }}
        />

        {/* Main circle */}
        <motion.div
          animate={controls}
          initial={{ scale: 0.6, opacity: 0.7 }}
          className="absolute rounded-full"
          style={{
            width: size * 0.8,
            height: size * 0.8,
            background: gradient,
            boxShadow: `0 0 60px ${color}40`,
            willChange: 'transform, opacity',
          }}
        />

        {/* Inner circle with text */}
        <motion.div
          animate={controls}
          initial={{ scale: 0.6, opacity: 0.7 }}
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            background: 'rgba(255,255,255,0.08)',
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)',
            willChange: 'transform, opacity',
          }}
        >
          <span className="text-white/90 text-base font-medium select-none">
            {phase === 'inhale' ? 'שאפ/י...' : 'נשפ/י...'}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
