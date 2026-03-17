import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Button } from '../ui/Button';

export function SessionSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    initialScore: number;
    finalScore: number;
    duration: number;
    scores: { time: number; score: number }[];
  } | null;

  const initialScore = state?.initialScore ?? 5;
  const finalScore = state?.finalScore ?? 2;
  const duration = state?.duration ?? 0;
  const scores = state?.scores ?? [];

  const improvement = initialScore > 0
    ? Math.round(((initialScore - finalScore) / initialScore) * 100)
    : 0;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-bg-primary to-bg-secondary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <h1 className="text-2xl font-bold">סיכום הרגעה</h1>

        {/* Score comparison */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-accent-stress">{initialScore}</div>
            <div className="text-sm text-text-secondary mt-1">לפני</div>
          </div>
          <div className="text-3xl text-text-secondary">→</div>
          <div className="text-center">
            <div className="text-5xl font-bold text-accent-success">{finalScore}</div>
            <div className="text-sm text-text-secondary mt-1">אחרי</div>
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card w-full">
          <div className="flex justify-between mb-4">
            <span className="text-text-secondary">משך</span>
            <span className="font-medium">{mins} דקות {secs > 0 ? `ו-${secs} שניות` : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">שיפור</span>
            <span className="font-medium text-accent-success">{improvement}%</span>
          </div>
        </div>

        {/* Feedback */}
        <p className="text-center text-lg">
          {improvement > 50
            ? `הצלחת להוריד ${improvement}% מהלחץ! 🎉`
            : improvement > 20
              ? `ירידה של ${improvement}% — התקדמות יפה! 👏`
              : 'כל תרגול עוזר. נסה שוב מאוחר יותר 💪'}
        </p>

        {/* Chart */}
        {scores.length > 1 && (
          <div className="glass-card w-full" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scores}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 10]} hide />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="url(#scoreGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button onClick={() => navigate('/')} size="lg" className="w-full" aria-label="חזרה לראשי">
            חזרה לראשי
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
