import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TremorGauge } from '../ui/TremorGauge';
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

  const getScoreColor = (score: number): string => {
    if (score >= 7) return '#ef4444';
    if (score >= 4) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="screen-scroll items-center px-6 py-8 bg-gradient-to-b from-bg-primary to-bg-secondary safe-area-top safe-area-bottom">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center gap-5"
      >
        <h1 className="text-2xl font-bold">סיכום הרגעה</h1>

        {/* Before/After Gauge comparison */}
        <div className="flex items-start gap-4 w-full justify-center">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="text-xs text-text-secondary mb-1">לפני</div>
            <TremorGauge
              intensity={initialScore / 10}
              size={140}
            />
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl text-text-secondary mt-12"
          >
            ←
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="text-xs text-text-secondary mb-1">אחרי</div>
            <TremorGauge
              intensity={finalScore / 10}
              size={140}
            />
          </motion.div>
        </div>

        {/* Improvement badge */}
        {improvement > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="px-5 py-2 rounded-full flex items-center gap-2"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <span className="text-accent-success font-bold text-lg">↓{improvement}%</span>
            <span className="text-accent-success text-sm">ירידה בלחץ</span>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="glass-card w-full"
        >
          <div className="flex justify-between mb-3">
            <span className="text-text-secondary">משך הרגעה</span>
            <span className="font-medium">{mins} דקות {secs > 0 ? `ו-${secs} שניות` : ''}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-text-secondary">ציון התחלתי</span>
            <span className="font-bold" style={{ color: getScoreColor(initialScore) }}>{initialScore}/10</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">ציון סופי</span>
            <span className="font-bold" style={{ color: getScoreColor(finalScore) }}>{finalScore}/10</span>
          </div>
        </motion.div>

        {/* Feedback */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-lg px-4"
        >
          {improvement > 50
            ? `הצלחת להוריד ${improvement}% מהלחץ! 🎉`
            : improvement > 20
              ? `ירידה של ${improvement}% — התקדמות יפה! 👏`
              : 'כל תרגול עוזר. נסה שוב מאוחר יותר 💪'}
        </motion.p>

        {/* Chart */}
        {scores.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="glass-card w-full"
          >
            <h3 className="text-sm text-text-secondary mb-2">מהלך הלחץ</h3>
            <div style={{ height: 120, direction: 'ltr' }}>
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
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="flex flex-col gap-3 w-full"
        >
          <Button onClick={() => navigate('/measurement')} size="lg" className="w-full" aria-label="מדידה חדשה">
            🔄 מדידה חדשה
          </Button>
          <Button onClick={() => navigate('/')} variant="secondary" size="md" className="w-full" aria-label="חזרה לראשי">
            חזרה לראשי
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
