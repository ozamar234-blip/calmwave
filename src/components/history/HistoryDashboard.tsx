import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useHistoryStore } from '../../stores/historyStore';

type TimeRange = 'week' | 'month' | '3months';

export function HistoryDashboard() {
  const { sessions, loading, loadSessions } = useHistoryStore();
  const [range, setRange] = useState<TimeRange>('week');

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      '3months': 90 * 24 * 60 * 60 * 1000,
    };
    return sessions.filter((s) => now - s.startTime < ranges[range]);
  }, [sessions, range]);

  const chartData = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    filteredSessions.forEach((s) => {
      const day = new Date(s.startTime).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' });
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(s.initialScore);
    });
    return Object.entries(grouped).map(([day, scores]) => ({
      day,
      avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    }));
  }, [filteredSessions]);

  const rangeLabels: Record<TimeRange, string> = {
    week: 'שבוע',
    month: 'חודש',
    '3months': '3 חודשים',
  };

  return (
    <div className="screen safe-area-top pb-28 px-6 pt-10 bg-bg-primary">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold mb-5">היסטוריה</h1>

        {/* Range filter */}
        <div className="flex gap-2 mb-5">
          {(Object.keys(rangeLabels) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors appearance-none border-none cursor-pointer ${
                range === r ? 'bg-accent-calm text-white' : 'glass text-text-secondary'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="glass-card mb-5" style={{ height: 200, direction: 'ltr' }}>
            <h3 className="text-sm text-text-secondary mb-2" style={{ direction: 'rtl' }}>ממוצע לחץ לפי יום</h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 10]} hide />
                <Tooltip
                  contentStyle={{
                    background: '#1a1333',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    direction: 'rtl',
                  }}
                />
                <Area type="monotone" dataKey="avg" stroke="#6366f1" fill="url(#histGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="glass-card text-center text-text-secondary py-10 mb-5">
            {loading ? 'טוען...' : 'אין עדיין נתונים. התחל את ההרגעה הראשונה שלך!'}
          </div>
        )}

        {/* Session list */}
        <h3 className="text-lg font-semibold mb-3">סשנים אחרונים</h3>
        <div className="flex flex-col gap-2.5">
          {filteredSessions.length === 0 && !loading && (
            <p className="text-text-secondary text-sm">אין סשנים בטווח הנבחר</p>
          )}
          {filteredSessions.map((s) => (
            <div key={s.id} className="glass-card flex justify-between items-center py-3">
              <div>
                <div className="text-sm text-text-secondary">
                  {new Date(s.startTime).toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-sm mt-0.5">
                  {Math.floor(s.duration / 60)} דקות
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-stress font-bold">{s.initialScore}</span>
                <span className="text-text-secondary">←</span>
                <span className="text-accent-success font-bold">{s.finalScore}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
