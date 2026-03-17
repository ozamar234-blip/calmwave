import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useHistoryStore } from '../stores/historyStore';
import { Button } from './ui/Button';

export function Dashboard() {
  const navigate = useNavigate();
  const { sessions, loadSessions } = useHistoryStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const lastSession = sessions[0] ?? null;

  const weeklySparkline = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions
      .filter((s) => s.startTime > weekAgo)
      .map((s) => ({ score: s.initialScore }))
      .reverse();
  }, [sessions]);

  const timeSinceLastSession = lastSession
    ? formatTimeSince(lastSession.endTime)
    : null;

  return (
    <div className="min-h-dvh pb-24 px-6 pt-12 bg-gradient-to-b from-bg-primary to-bg-secondary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto flex flex-col items-center gap-8"
      >
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-calm to-purple-400 bg-clip-text text-transparent">
            CalmWave
          </h1>
          <p className="text-text-secondary text-sm mt-1">מוזיקה שמרגישה את הלחץ שלך</p>
        </div>

        {/* Main CTA */}
        <Button
          onClick={() => navigate('/measurement')}
          size="round"
          className="pulse-glow mt-4"
          aria-label="התחל הרגעה"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">🌊</span>
            <span className="text-base">התחל הרגעה</span>
          </div>
        </Button>

        {/* Last session */}
        {lastSession && (
          <div className="glass-card w-full text-center">
            <p className="text-sm text-text-secondary mb-1">הרגעה אחרונה: {timeSinceLastSession}</p>
            <p className="text-lg">
              ציון: <span className="text-accent-stress font-bold">{lastSession.initialScore}</span>
              <span className="text-text-secondary mx-2">→</span>
              <span className="text-accent-success font-bold">{lastSession.finalScore}</span>
            </p>
          </div>
        )}

        {/* Weekly sparkline */}
        {weeklySparkline.length > 1 && (
          <div className="glass-card w-full">
            <h3 className="text-sm text-text-secondary mb-2">מגמה שבועית</h3>
            <div style={{ height: 60 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklySparkline}>
                  <defs>
                    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#spark)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!lastSession && (
          <div className="glass-card w-full text-center text-text-secondary">
            <p>עדיין לא ביצעת הרגעה.</p>
            <p className="text-sm mt-1">לחץ על הכפתור למעלה כדי להתחיל!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function formatTimeSince(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}
