import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const INTENSITY_COLOR = [
  'bg-surface-container',
  'bg-primary/30',
  'bg-primary/70',
  'bg-primary',
];

// Reusable Card Component matching the global theme
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-surface-container-lowest custom-card-shadow rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${className}`}>
    {children}
  </div>
);

// Circular Progress Component
const CircularProgress = ({ percentage, size = 60, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-surface-container-high"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex items-center justify-center text-sm font-bold text-on-surface">
        {percentage}%
      </div>
    </div>
  );
};

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant text-sm font-medium">Loading analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-error-container text-on-error-container px-6 py-4 rounded-2xl mt-8 text-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px]">error</span>
        {error || 'No data available.'}
      </div>
    );
  }

  const { summary, weekly, monthly, heatmap, habit_stats } = stats;

  const weeklyAvg = weekly.length ? Math.round(weekly.reduce((acc, curr) => acc + (curr.pct || 0), 0) / weekly.length) : 0;
  const isConsistent = weeklyAvg > 50;
  const motivationText = isConsistent 
    ? `Exceptional performance! You are ${Math.max(12, Math.round(weeklyAvg / 5))}% more consistent this week.`
    : `Keep pushing! A tiny step today builds the momentum for tomorrow.`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">
            Analytics
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base font-medium">Monitoring habit trajectories and performance metrics.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-low px-5 py-3 rounded-2xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary text-[28px]">insights</span>
          <p className="text-sm font-medium text-on-surface-variant max-w-[200px] leading-tight">
            {motivationText}
          </p>
        </div>
      </header>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Current Streak</span>
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings:"'FILL' 1"}}>local_fire_department</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-on-surface">{summary.current_streak}</span>
            <span className="text-on-surface-variant text-sm font-medium">days</span>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Overall Rate</span>
            <span className="material-symbols-outlined text-primary">monitoring</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-on-surface">{summary.completion_rate || 0}</span>
              <span className="text-on-surface-variant text-sm font-medium">%</span>
            </div>
            <CircularProgress percentage={summary.completion_rate || 0} size={46} strokeWidth={4} />
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Best Streak</span>
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings:"'FILL' 1"}}>emoji_events</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-on-surface">
              {habit_stats.length ? Math.max(...habit_stats.map(h => h.best_streak)) : 0}
            </span>
            <span className="text-on-surface-variant text-sm font-medium">days</span>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
            <span className="material-symbols-outlined text-[100px]">task_alt</span>
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Today's Focus</span>
            <span className="material-symbols-outlined text-primary">adjust</span>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-4xl font-black text-on-surface">{summary.done_today}</span>
            <span className="text-on-surface-variant text-xl font-medium">/ {summary.total_habits}</span>
          </div>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Bar Chart */}
        <GlassCard>
          <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bar_chart</span>
            Weekly Trajectory
          </h3>
          {weekly.length === 0 ? (
            <p className="text-on-surface-variant text-sm text-center py-10">No weekly data yet.</p>
          ) : (
            <div className="flex justify-between items-end h-48 gap-2 mt-4 px-2">
              {weekly.map((d, i) => {
                const isToday = d.log_date === date;
                const pct = d.pct || 0;
                const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date(d.log_date).getDay()];
                return (
                  <div key={d.log_date || i} className="flex flex-col items-center gap-3 w-full group">
                    <span className={`text-xs font-bold transition-all duration-300 opacity-0 group-hover:opacity-100 ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{pct}%</span>
                    <div className="w-full h-full flex flex-col justify-end bg-surface-container rounded-t-lg relative overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-1000 ease-out relative ${isToday ? 'bg-primary' : pct > 0 ? 'bg-secondary-fixed-dim' : 'bg-transparent'}`}
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      >
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{dayName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Heatmap */}
        <div className="space-y-6 flex flex-col">
          <GlassCard className="flex-1">
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Activity Heatmap
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <span key={`header-${i}`} className="text-[10px] text-center text-on-surface-variant font-bold">{d}</span>
              ))}
              {heatmap.map((cell) => {
                const intensity = Math.min(cell.count, 3);
                return (
                  <div
                    key={cell.log_date}
                    className={`aspect-square rounded-md transition-colors duration-300 ${INTENSITY_COLOR[intensity]} ${intensity > 0 ? 'hover:scale-110 cursor-pointer shadow-sm' : ''}`}
                    title={`${cell.log_date}: ${cell.count} habits`}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-5 justify-end">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Less</span>
              {INTENSITY_COLOR.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">More</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Detailed Habit Breakdown */}
      <GlassCard>
        <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">donut_large</span>
          Individual Matrix
        </h3>
        {habit_stats.length === 0 ? (
          <p className="text-on-surface-variant text-sm text-center py-8">No habits integrated.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habit_stats.map((h) => (
              <div key={h.id} className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-xl flex items-center gap-4 hover:bg-surface-container transition-colors duration-300">
                <CircularProgress percentage={h.completion_rate} size={54} strokeWidth={4} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">{h.icon}</span>
                    {h.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>local_fire_department</span>
                      {h.current_streak} Cur
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                      <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>emoji_events</span>
                      {h.best_streak} Best
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

    </div>
  );
}
