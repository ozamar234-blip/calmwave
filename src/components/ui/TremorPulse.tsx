import { motion } from 'framer-motion';

interface TremorPulseProps {
  /** 0-1 intensity */
  intensity: number;
  size?: number;
}

/**
 * Pulsing circle that visualizes tremor intensity in real time.
 * Shakes dramatically with any detected motion.
 */
export function TremorPulse({ intensity, size = 160 }: TremorPulseProps) {
  const color =
    intensity > 0.6
      ? '#ef4444'
      : intensity > 0.3
        ? '#f59e0b'
        : '#6366f1';

  // Much stronger shake for visible feedback
  const shakeAmount = Math.max(1, intensity * 12);
  const shakeDuration = Math.max(0.05, 0.2 - intensity * 0.15);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer ripple rings — more visible */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          animate={{
            scale: [1, 1.5 + intensity * 0.6],
            opacity: [0.4 + intensity * 0.3, 0],
          }}
          transition={{
            duration: Math.max(0.5, 1.5 - intensity * 0.8),
            repeat: Infinity,
            delay: i * 0.35,
            ease: 'easeOut',
          }}
          style={{
            width: size * 0.55,
            height: size * 0.55,
            border: `2px solid ${color}`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Background glow */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.1, 0.2 + intensity * 0.3, 0.1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: `radial-gradient(circle, ${color}30, transparent)`,
          willChange: 'transform, opacity',
        }}
      />

      {/* Main tremor circle — shakes with intensity */}
      <motion.div
        animate={{
          x: [0, shakeAmount, -shakeAmount, shakeAmount * 0.7, -shakeAmount * 0.5, 0],
          y: [0, -shakeAmount * 0.6, shakeAmount * 0.8, -shakeAmount * 0.4, shakeAmount * 0.3, 0],
          scale: [1, 1 + intensity * 0.08, 1 - intensity * 0.04, 1 + intensity * 0.06, 1],
        }}
        transition={{
          duration: shakeDuration,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: `radial-gradient(circle, ${color}50, ${color}15)`,
          border: `2px solid ${color}90`,
          boxShadow: `0 0 ${20 + intensity * 50}px ${color}50, inset 0 0 ${10 + intensity * 20}px ${color}20`,
          willChange: 'transform',
        }}
      >
        {/* Inner percentage display */}
        <div className="flex flex-col items-center gap-0.5">
          <motion.span
            className="text-2xl font-bold tabular-nums"
            style={{ color }}
            animate={{ scale: [1, 1 + intensity * 0.1, 1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            {Math.round(intensity * 100)}%
          </motion.span>
          <span className="text-[10px] opacity-60">עוצמת רעד</span>
        </div>
      </motion.div>
    </div>
  );
}
