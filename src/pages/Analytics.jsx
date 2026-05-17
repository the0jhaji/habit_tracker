import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const INTENSITY_COLOR = [
  'bg-surface-container',
  'bg-primary/20',
  'bg-primary/50',
  'bg-primary',
];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const date = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const data = await api.getStats(date);
      setStats(data);
    } catch (err) {
      setError('Could not load analytics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener('habit-added', handler);
    return () => window.removeEventListener('habit-added', handler);
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant text-sm">Loading analytics…</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl mt-8 text-sm flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">error</span>
        {error || 'No data available.'}
      </div>
    );
  }

  const { summary, weekly, monthly, heatmap, habit_stats } = stats;

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">Detail & Analytics</h1>
        <p className="text-lg text-on-surface-variant max-w-xl">
          Deep-dive into your habit performance, streaks, and completion trends.
        </p>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Current Streak', value: `${summary.current_streak} days`, icon: 'local_fire_department', fill: true },
          { label: 'Active Habits', value: summary.total_habits, icon: 'checklist' },
          { label: 'Completion Rate', value: `${summary.completion_rate || 0}%`, icon: 'insights' },
          { label: 'Done Today', value: `${summary.done_today}/${summary.total_habits}`, icon: 'task_alt' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest custom-card-shadow rounded-xl p-5">
            <span
              className="material-symbols-outlined text-primary mb-3 block text-[28px]"
              style={s.fill ? { fontVariationSettings: "'FILL' 1" } : {}}
            >{s.icon}</span>
            <div className="text-2xl font-bold text-on-surface">{s.value}</div>
            <div className="text-xs text-on-surface-variant mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Monthly Chart */}
        <div className="bg-surface-container-lowest custom-card-shadow rounded-xl p-6">
          <h3 className="text-xl font-semibold text-on-surface mb-6">Monthly Completion</h3>
          {monthly.length === 0 ? (
            <p className="text-on-surface-variant text-sm text-center py-8">No data yet. Keep tracking!</p>
          ) : (
            <div className="flex justify-between items-end h-40 gap-3">
              {monthly.map((d) => (
                <div key={d.ym} className="flex flex-col items-center gap-2 w-full">
                  <span className="text-xs font-bold text-primary">{d.pct || 0}%</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all duration-700"
                      style={{ height: `${Math.max(d.pct || 0, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant">{d.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div className="bg-surface-container-lowest custom-card-shadow rounded-xl p-6">
          <h3 className="text-xl font-semibold text-on-surface mb-1">Activity Heatmap</h3>
          <p className="text-xs text-on-surface-variant mb-4">Last 5 weeks</p>
          <div className="grid grid-cols-7 gap-1.5">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <span key={`header-${i}`} className="text-[10px] text-center text-on-surface-variant font-semibold">{d}</span>
            ))}
            {heatmap.map((cell) => {
              const intensity = Math.min(cell.count, 3);
              return (
                <div
                  key={cell.log_date}
                  className={`aspect-square rounded-sm ${INTENSITY_COLOR[intensity]}`}
                  title={`${cell.log_date}: ${cell.count} habits`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-on-surface-variant">Less</span>
            {INTENSITY_COLOR.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-outline-variant/30`} />
            ))}
            <span className="text-xs text-on-surface-variant">More</span>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-surface-container-lowest custom-card-shadow rounded-xl p-6 mb-8">
        <h3 className="text-xl font-semibold text-on-surface mb-6">Weekly Trend</h3>
        {weekly.length === 0 ? (
          <p className="text-on-surface-variant text-sm text-center py-8">No weekly data yet.</p>
        ) : (
          <div className="flex justify-between items-end h-32 gap-2 px-2">
            {weekly.map((d, i) => {
              const isToday = d.log_date === date;
              const pct = d.pct || 0;
              const dayName = ['S','M','T','W','T','F','S'][new Date(d.log_date).getDay()];
              return (
                <div key={d.log_date || i} className="flex flex-col items-center gap-2 w-full">
                  <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{pct}%</span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : pct > 0 ? 'bg-secondary-fixed-dim' : 'bg-surface-container'}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className={`text-xs font-semibold ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{dayName}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-Habit Breakdown */}
      <div className="bg-surface-container-lowest custom-card-shadow rounded-xl p-6">
        <h3 className="text-xl font-semibold text-on-surface mb-6">Habit Breakdown</h3>
        {habit_stats.length === 0 ? (
          <p className="text-on-surface-variant text-sm text-center py-8">No habits tracked yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {habit_stats.map((h) => (
              <div key={h.id}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{h.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-on-surface">{h.name}</span>
                      <span className="text-sm font-bold text-primary">{h.completion_rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${h.completion_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pl-13">
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant ml-13">
                    <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>local_fire_department</span>
                    <span>Current: <strong className="text-on-surface">{h.current_streak} days</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>emoji_events</span>
                    <span>Best: <strong className="text-on-surface">{h.best_streak} days</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
