import { useEffect, useState, useMemo } from 'react';
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

function getBreathLabel(score: number): string {
  if (score >= 7) return 'נשימה עמוקה';
  if (score >= 4) return 'נשימה רגועה';
  return 'נשימה טבעית';
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
    return () => {
      cancelled = true;
    };
  }, [controls, inhaleDuration, exhaleDuration]);

  const color = getBreathColor(stressScore);
  const gradient = getGradient(stressScore);
  const size = useMemo(
    () => Math.min(260, typeof window !== 'undefined' ? window.innerWidth * 0.6 : 260),
    [],
  );

  // Stress-reactive tremor shake
  const shakeIntensity = stressScore >= 7 ? 3 : stressScore >= 5 ? 1.5 : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Stress-reactive ring indicators */}
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-500"
            style={{
              background:
                i < stressScore
                  ? stressScore >= 7
                    ? '#ef4444'
                    : stressScore >= 4
                      ? '#f59e0b'
                      : '#10b981'
                  : 'rgba(255,255,255,0.1)',
              boxShadow:
                i < stressScore && i >= stressScore - 2
                  ? `0 0 6px ${color}80`
                  : 'none',
            }}
          />
        ))}
      </div>

      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outermost ripple rings — more visible at high stress */}
        {stressScore >= 5 && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ripple-${i}`}
                className="absolute rounded-full"
                animate={{
                  scale: [0.8, 1.3 + stressScore * 0.03],
                  opacity: [0.15 + stressScore * 0.02, 0],
                }}
                transition={{
                  duration: 2 - stressScore * 0.08,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeOut',
                }}
                style={{
                  width: size,
                  height: size,
                  border: `1.5px solid ${color}`,
                  willChange: 'transform, opacity',
                }}
              />
            ))}
          </>
        )}

        {/* Outer glow */}
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

        {/* Main circle — shakes with stress */}
        <motion.div
          animate={{
            ...controls,
            x:
              shakeIntensity > 0
                ? [0, shakeIntensity, -shakeIntensity, shakeIntensity / 2, 0]
                : 0,
          }}
          transition={
            shakeIntensity > 0
              ? { x: { duration: 0.2, repeat: Infinity, ease: 'linear' } }
              : undefined
          }
          className="absolute rounded-full"
          style={{
            width: size * 0.8,
            height: size * 0.8,
            background: gradient,
            boxShadow: `0 0 ${40 + stressScore * 6}px ${color}40`,
            willChange: 'transform, opacity',
          }}
        >
          {/* Inner animated rings */}
          <motion.div
            animate={controls}
            initial={{ scale: 0.6, opacity: 0.7 }}
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), transparent 60%)`,
            }}
          />
        </motion.div>

        {/* Inner circle with text + BPM */}
        <motion.div
          animate={controls}
          initial={{ scale: 0.6, opacity: 0.7 }}
          className="absolute rounded-full flex flex-col items-center justify-center"
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
          <span className="text-white/40 text-[10px] mt-0.5">
            {Math.round(currentBpm)} BPM
          </span>
        </motion.div>
      </div>

      {/* Label under breathing circle */}
      <div className="text-xs text-text-secondary">
        {getBreathLabel(stressScore)}
      </div>
    </div>
  );
}
