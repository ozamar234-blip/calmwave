import { motion, useSpring, useTransform } from 'framer-motion';

interface TremorGaugeProps {
  /** 0–1 normalized intensity */
  intensity: number;
  /** Optional label */
  label?: string;
  size?: number;
}

const GAUGE_SEGMENTS = [
  { color: '#10b981', label: 'רגוע' },
  { color: '#38bdf8', label: '' },
  { color: '#f59e0b', label: 'בינוני' },
  { color: '#f97316', label: '' },
  { color: '#ef4444', label: 'גבוה' },
];

/**
 * Semi-circular tremor gauge with animated needle.
 * Looks like a real instrument meter.
 */
export function TremorGauge({ intensity, label, size = 220 }: TremorGaugeProps) {
  const springValue = useSpring(intensity, { stiffness: 80, damping: 15 });
  // Map 0-1 to angle -90deg (left) to +90deg (right)
  const needleRotation = useTransform(springValue, [0, 1], [-90, 90]);

  const cx = size / 2;
  const cy = size * 0.6;
  const outerR = size * 0.42;
  const innerR = outerR * 0.7;
  const needleLen = outerR * 0.95;

  // Generate arc segments
  const arcSegments = GAUGE_SEGMENTS.map((seg, i) => {
    const totalAngle = Math.PI; // 180 degrees
    const segAngle = totalAngle / GAUGE_SEGMENTS.length;
    const startAngle = Math.PI + i * segAngle;
    const endAngle = startAngle + segAngle;

    const x1Outer = cx + outerR * Math.cos(startAngle);
    const y1Outer = cy + outerR * Math.sin(startAngle);
    const x2Outer = cx + outerR * Math.cos(endAngle);
    const y2Outer = cy + outerR * Math.sin(endAngle);
    const x1Inner = cx + innerR * Math.cos(endAngle);
    const y1Inner = cy + innerR * Math.sin(endAngle);
    const x2Inner = cx + innerR * Math.cos(startAngle);
    const y2Inner = cy + innerR * Math.sin(startAngle);

    const d = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerR} ${outerR} 0 0 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerR} ${innerR} 0 0 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ');

    return { d, color: seg.color, label: seg.label, angle: (startAngle + endAngle) / 2 };
  });

  // Tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const angle = Math.PI + (i / 10) * Math.PI;
    const x1 = cx + (outerR + 4) * Math.cos(angle);
    const y1 = cy + (outerR + 4) * Math.sin(angle);
    const tickLen = i % 5 === 0 ? 10 : 5;
    const x2 = cx + (outerR + 4 + tickLen) * Math.cos(angle);
    const y2 = cy + (outerR + 4 + tickLen) * Math.sin(angle);
    return { x1, y1, x2, y2, major: i % 5 === 0, value: i };
  });

  // Get color for current value
  const getColor = (val: number): string => {
    if (val <= 0.2) return '#10b981';
    if (val <= 0.4) return '#38bdf8';
    if (val <= 0.6) return '#f59e0b';
    if (val <= 0.8) return '#f97316';
    return '#ef4444';
  };

  const currentColor = getColor(intensity);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.7}`}
        style={{ overflow: 'visible' }}
      >
        {/* Glow filter */}
        <defs>
          <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Arc segments with glow */}
        {arcSegments.map((seg, i) => (
          <g key={i}>
            <path d={seg.d} fill={`${seg.color}20`} filter="url(#arcGlow)" />
            <path
              d={seg.d}
              fill={`${seg.color}${intensity > i / GAUGE_SEGMENTS.length ? '60' : '20'}`}
              stroke={`${seg.color}40`}
              strokeWidth={0.5}
            />
          </g>
        ))}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}
            strokeWidth={t.major ? 1.5 : 0.8}
          />
        ))}

        {/* Tick labels */}
        {ticks.filter((t) => t.major).map((t, i) => {
          const angle = Math.PI + (t.value / 10) * Math.PI;
          const lx = cx + (outerR + 22) * Math.cos(angle);
          const ly = cy + (outerR + 22) * Math.sin(angle);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize={9}
              fontFamily="Heebo, sans-serif"
            >
              {t.value}
            </text>
          );
        })}

        {/* Needle shadow/glow */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - needleLen}
          stroke={currentColor}
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#needleGlow)"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            rotate: needleRotation,
          }}
          opacity={0.5}
        />

        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - needleLen}
          stroke={currentColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            rotate: needleRotation,
          }}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={6} fill={currentColor} />
        <circle cx={cx} cy={cy} r={3} fill="#0f0a1e" />

        {/* Value display */}
        <text
          x={cx}
          y={cy + 24}
          textAnchor="middle"
          fill={currentColor}
          fontSize={22}
          fontWeight="bold"
          fontFamily="Heebo, sans-serif"
        >
          {Math.round(intensity * 10)}
        </text>
        <text
          x={cx}
          y={cy + 38}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize={10}
          fontFamily="Heebo, sans-serif"
        >
          /10
        </text>
      </svg>

      {label && (
        <div className="text-sm text-text-secondary mt-1">{label}</div>
      )}
    </div>
  );
}
