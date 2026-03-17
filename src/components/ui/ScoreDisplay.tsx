import { motion } from 'framer-motion';

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'lg';
}

function getScoreColor(score: number): string {
  if (score <= 3) return '#10b981';
  if (score <= 6) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score <= 3) return 'רגוע/ה';
  if (score <= 6) return 'לחץ בינוני';
  return 'לחץ גבוה';
}

function getScoreEmoji(score: number): string {
  if (score <= 3) return '😌';
  if (score <= 6) return '😐';
  return '😰';
}

export function ScoreDisplay({ score, size = 'lg' }: ScoreDisplayProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const emoji = getScoreEmoji(score);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`font-bold ${size === 'lg' ? 'text-7xl' : 'text-4xl'}`}
        style={{ color }}
      >
        {score}
      </div>
      <div className={`${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
        {emoji} {label}
      </div>
    </motion.div>
  );
}
