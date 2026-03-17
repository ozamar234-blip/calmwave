import { motion } from 'framer-motion';

interface TremorPulseProps {
  /** 0-1 intensity */
  intensity: number;
  size?: number;
}

/**
 * Pulsing circle that visualizes tremor intensity in real time.
 * Shakes and glows more as tremor increases.
 */
export function TremorPulse({ intensity, size = 160 }: TremorPulseProps) {
  const color =
    intensity > 0.7
      ? '#ef4444'
      : intensity > 0.4
        ? '#f59e0b'
        : '#6366f1';

  const shakeAmount = intensity * 4;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer ripple rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          animate={{
            scale: [1, 1.4 + intensity * 0.4],
            opacity: [0.3 + intensity * 0.2, 0],
          }}
          transition={{
            duration: 1.5 - intensity * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
          style={{
            width: size * 0.6,
            height: size * 0.6,
            border: `2px solid ${color}`,
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Main tremor circle — shakes with intensity */}
      <motion.div
        animate={{
          x: [0, shakeAmount, -shakeAmount, shakeAmount, 0],
          y: [0, -shakeAmount * 0.5, shakeAmount * 0.5, -shakeAmount * 0.3, 0],
          scale: [1, 1 + intensity * 0.05, 1 - intensity * 0.03, 1 + intensity * 0.04, 1],
        }}
        transition={{
          duration: 0.15 + (1 - intensity) * 0.15,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          background: `radial-gradient(circle, ${color}40, ${color}10)`,
          border: `2px solid ${color}80`,
          boxShadow: `0 0 ${20 + intensity * 40}px ${color}40`,
          willChange: 'transform',
        }}
      >
        {/* Inner icon */}
        <motion.div
          animate={{
            rotate: [0, intensity * 10, -intensity * 10, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
          }}
          className="text-2xl select-none"
        >
          📳
        </motion.div>
      </motion.div>
    </div>
  );
}
