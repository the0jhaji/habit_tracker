import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const INTENSITY_COLOR = [
  'bg-white/5',
  'bg-blue-500/40',
  'bg-blue-500/70',
  'bg-blue-400',
];

// Reusable Glass Card Component
const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl p-6 transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 ${className}`}>
    {children}
  </div>
);

// Circular Progress Component
const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, color = 'text-blue-400' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-white/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
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
      <div className="absolute flex items-center justify-center text-sm font-bold text-white">
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/70 text-sm font-medium tracking-wide">INITIALIZING TELEMETRY...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-2xl mt-8 text-sm flex items-center gap-3 backdrop-blur-md">
        <span className="material-symbols-outlined text-[20px]">error</span>
        {error || 'No data available.'}
      </div>
    );
  }

  const { summary, weekly, monthly, heatmap, habit_stats } = stats;

  // Calculate some dynamic motivation text based on data
  const weeklyAvg = weekly.length ? Math.round(weekly.reduce((acc, curr) => acc + (curr.pct || 0), 0) / weekly.length) : 0;
  const isConsistent = weeklyAvg > 50;
  const motivationText = isConsistent 
    ? `Exceptional performance! You are ${Math.max(12, Math.round(weeklyAvg / 5))}% more consistent this week.`
    : `Keep pushing! A tiny step today builds the momentum for tomorrow.`;

  return (
    <div className="min-h-screen bg-[#070b14] text-white -m-4 p-4 md:-m-8 md:p-8 relative overflow-hidden font-sans">
      {/* Ambient glowing background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold tracking-widest rounded-full border border-blue-500/30">LIVE DATA</span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Analytics Core
              </h1>
            </div>
            <p className="text-white/50 text-sm md:text-base font-medium">Monitoring habit trajectories and performance metrics.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="material-symbols-outlined text-blue-400 text-[28px]">insights</span>
            <p className="text-sm font-medium text-white/80 max-w-[200px] leading-tight">
              {motivationText}
            </p>
          </div>
        </header>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Current Streak</span>
              <span className="material-symbols-outlined text-orange-400">local_fire_department</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{summary.current_streak}</span>
              <span className="text-white/40 text-sm font-medium">days</span>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Overall Rate</span>
              <span className="material-symbols-outlined text-green-400">monitoring</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{summary.completion_rate || 0}</span>
                <span className="text-white/40 text-sm font-medium">%</span>
              </div>
              <CircularProgress percentage={summary.completion_rate || 0} size={46} strokeWidth={4} color="text-green-400" />
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Best Streak</span>
              <span className="material-symbols-outlined text-yellow-400">emoji_events</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">
                {habit_stats.length ? Math.max(...habit_stats.map(h => h.best_streak)) : 0}
              </span>
              <span className="text-white/40 text-sm font-medium">days</span>
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
              <span className="material-symbols-outlined text-[100px]">task_alt</span>
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Today's Focus</span>
              <span className="material-symbols-outlined text-blue-400">adjust</span>
            </div>
            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-4xl font-black">{summary.done_today}</span>
              <span className="text-white/40 text-xl font-medium">/ {summary.total_habits}</span>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress Bar Chart */}
          <GlassCard>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">bar_chart</span>
              Weekly Trajectory
            </h3>
            {weekly.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-10">Awaiting data input...</p>
            ) : (
              <div className="flex justify-between items-end h-48 gap-2 mt-4 px-2">
                {weekly.map((d, i) => {
                  const isToday = d.log_date === date;
                  const pct = d.pct || 0;
                  const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date(d.log_date).getDay()];
                  return (
                    <div key={d.log_date || i} className="flex flex-col items-center gap-3 w-full group">
                      <span className={`text-xs font-bold transition-all duration-300 opacity-0 group-hover:opacity-100 ${isToday ? 'text-blue-400' : 'text-white/60'}`}>{pct}%</span>
                      <div className="w-full h-full flex flex-col justify-end bg-white/5 rounded-t-lg relative overflow-hidden">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-1000 ease-out relative ${isToday ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : pct > 0 ? 'bg-gradient-to-t from-white/10 to-white/30' : 'bg-transparent'}`}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        >
                          {isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-white/50 rounded-t-lg" />}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold tracking-wider ${isToday ? 'text-blue-400' : 'text-white/40'}`}>{dayName}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Monthly Consistency & Heatmap */}
          <div className="space-y-6 flex flex-col">
            <GlassCard className="flex-1">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400">calendar_month</span>
                Activity Heatmap
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <span key={`header-${i}`} className="text-[10px] text-center text-white/40 font-bold">{d}</span>
                ))}
                {heatmap.map((cell) => {
                  const intensity = Math.min(cell.count, 3);
                  return (
                    <div
                      key={cell.log_date}
                      className={`aspect-square rounded-md transition-colors duration-300 ${INTENSITY_COLOR[intensity]} ${intensity > 0 ? 'shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110 cursor-pointer' : ''}`}
                      title={`${cell.log_date}: ${cell.count} habits`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-5 justify-end">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Less</span>
                {INTENSITY_COLOR.map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">More</span>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Detailed Habit Breakdown */}
        <GlassCard>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400">donut_large</span>
            Individual Matrix
          </h3>
          {habit_stats.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No habits integrated.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habit_stats.map((h) => (
                <div key={h.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors duration-300">
                  <CircularProgress percentage={h.completion_rate} size={54} strokeWidth={4} color="text-teal-400" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-white/50">{h.icon}</span>
                      {h.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-[11px] text-white/50 font-medium">
                        <span className="material-symbols-outlined text-[14px] text-orange-400">local_fire_department</span>
                        {h.current_streak} Cur
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-white/50 font-medium">
                        <span className="material-symbols-outlined text-[14px] text-yellow-400">emoji_events</span>
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
    </div>
  );
}
