import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import AddHabitModal from '../components/AddHabitModal';

const today = () => new Date().toISOString().slice(0, 10);

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function Dashboard() {
  const [habits, setHabits] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyGrid, setWeeklyGrid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toggling, setToggling] = useState(null);
  const date = today();

  const load = useCallback(async () => {
    try {
      const [habitsData, statsData] = await Promise.all([
        api.getHabits(date),
        api.getStats(date),
      ]);
      setHabits(habitsData);
      setWeeklyData(statsData.weekly || []);
      setWeeklyGrid(statsData.weekly_grid || []);
      setError('');
    } catch (err) {
      setError('Could not connect to the server. Is the backend running?');
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

  const toggleHeatmapCell = async (habitId, cellDate, currentVal) => {
    try {
      await api.toggleHabit(habitId, cellDate);
      load();
    } catch (err) {
      console.error('Heatmap toggle failed:', err);
    }
  };

  const toggleHabit = async (id) => {
    setToggling(id);
    try {
      await api.toggleHabit(id, date);
      setHabits(prev => prev.map(h => h.id === id ? { ...h, done: h.done ? 0 : 1 } : h));
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setToggling(null);
    }
  };

  const handleAdded = (habit) => {
    setHabits(prev => [...prev, habit]);
  };

  const doneCount = habits.filter(h => h.done).length;
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - pct / 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant text-sm">Loading your habits…</p>
      </div>
    );
  }

  return (
    <div>
      {showModal && <AddHabitModal onClose={() => setShowModal(false)} onAdded={handleAdded} />}

      {error && (
        <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Welcome Header */}
      <section className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">Welcome back</h1>
        <p className="text-lg text-on-surface-variant max-w-xl">
          {doneCount === habits.length && habits.length > 0
            ? '🎉 All habits done for today! Amazing work!'
            : `${doneCount} of ${habits.length} habits checked off. Keep going!`}
        </p>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Progress Circle */}
        <div className="md:col-span-4 bg-surface-container-lowest custom-card-shadow rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full circular-progress" viewBox="0 0 100 100">
              <circle className="text-secondary-fixed stroke-current" cx="50" cy="50" fill="transparent" r="42" strokeWidth="8" />
              <circle
                className="text-primary stroke-current transition-all duration-700"
                cx="50" cy="50" fill="transparent" r="42"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round" strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-5xl font-bold text-primary leading-none">{pct}%</span>
              <span className="text-xs font-semibold text-on-surface-variant">Complete</span>
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-on-surface mb-2">Daily Focus</h3>
          <p className="text-base text-on-surface-variant">{doneCount} of {habits.length} habits checked off for today.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-5 flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Habit
          </button>
        </div>

        {/* Right Column */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Weekly Snapshot */}
          <div className="bg-surface-container-lowest custom-card-shadow rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-on-surface">Weekly Snapshot</h3>
              <span className="text-sm font-medium text-primary bg-secondary-container px-3 py-1 rounded-full">Last 7 days</span>
            </div>
            
            {/* Bar chart trend */}
            <div className="flex justify-between items-end h-28 gap-2 px-2 mb-6">
              {weeklyData.map((d, i) => {
                const dayIdx = (new Date(d.log_date).getDay());
                const pctVal = d.pct || 0;
                const isToday = d.log_date === date;
                return (
                  <div key={d.log_date || i} className="flex flex-col items-center gap-2 w-full">
                    <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{pctVal}%</span>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : pctVal > 0 ? 'bg-secondary-fixed-dim' : 'bg-surface-container'}`}
                      style={{ height: `${Math.max(pctVal, 4)}%` }}
                    />
                    <span className={`text-xs font-semibold ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                      {['Su','M','Tu','W','Th','F','Sa'][dayIdx]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Weekly Snapshot Heatmap Grid */}
            {weeklyGrid && weeklyGrid.length > 0 && (
              <div className="border-t border-outline-variant/30 pt-6">
                <h4 className="text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-wider">Weekly Heatmap Track</h4>
                <div className="flex flex-col gap-3">
                  {/* Grid Header Days */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 text-xs font-semibold text-on-surface-variant truncate">Habit</div>
                    <div className="col-span-8 grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-on-surface-variant">
                      {weeklyData.map((d) => {
                        const dayIdx = new Date(d.log_date).getDay();
                        return <span key={d.log_date}>{['Su','M','Tu','W','Th','F','Sa'][dayIdx]}</span>;
                      })}
                    </div>
                  </div>
                  
                  {/* Habit Heatmap Rows */}
                  {Object.values(
                    weeklyGrid.reduce((acc, cell) => {
                      if (!acc[cell.habit_id]) {
                        acc[cell.habit_id] = { id: cell.habit_id, name: cell.habit_name, icon: cell.habit_icon, cells: [] };
                      }
                      acc[cell.habit_id].cells.push(cell);
                      return acc;
                    }, {})
                  ).map((h) => (
                    <div key={h.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 flex items-center gap-2 text-sm font-medium text-on-surface truncate">
                        <div className="w-6 h-6 rounded-full bg-secondary-fixed-dim/30 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-[14px] text-primary">{h.icon}</span>
                        </div>
                        <span className="truncate">{h.name}</span>
                      </div>
                      <div className="col-span-8 grid grid-cols-7 gap-1.5">
                        {h.cells.map((cell) => {
                          const isCellToday = cell.log_date === date;
                          return (
                            <button
                              key={cell.log_date}
                              onClick={() => toggleHeatmapCell(cell.habit_id, cell.log_date, cell.completed)}
                              title={`${h.name}: ${cell.completed ? 'Done' : 'Not done'} on ${cell.log_date}`}
                              className={`aspect-square rounded-md transition-all duration-200 flex items-center justify-center cursor-pointer border ${
                                cell.completed
                                  ? 'bg-primary border-primary text-on-primary shadow-sm hover:opacity-90'
                                  : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                              } ${isCellToday ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                            >
                              {cell.completed && (
                                <span className="material-symbols-outlined text-[10px] font-bold">check</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Habits', value: habits.length, icon: 'checklist' },
              { label: 'Done Today', value: doneCount, icon: 'task_alt' },
              { label: 'Best Streak', value: `${Math.max(...habits.map(h => h.streak || 0), 0)}d`, icon: 'local_fire_department' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-lowest custom-card-shadow rounded-xl p-4 text-center">
                <span className="material-symbols-outlined text-primary text-[24px] mb-1 block" style={s.icon === 'local_fire_department' ? {fontVariationSettings:"'FILL' 1"} : {}}>{s.icon}</span>
                <div className="text-2xl font-bold text-on-surface">{s.value}</div>
                <div className="text-xs text-on-surface-variant">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Checklist */}
      <section className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold text-primary">Daily Checklist</h2>
          <span className="text-sm text-on-surface-variant">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">checklist</span>
            <p className="text-on-surface-variant mb-4">No habits yet. Start building your routine!</p>
            <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary px-6 py-2.5 rounded-full text-sm font-semibold">
              Add Your First Habit
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {habits.map(habit => (
              <div
                key={habit.id}
                className={`bg-surface-container-lowest custom-card-shadow rounded-xl p-4 flex items-center justify-between transition-all hover:translate-x-1 ${!habit.done ? 'border-l-4 border-primary' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${habit.done ? 'bg-secondary-fixed text-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                    <span className="material-symbols-outlined">{habit.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-on-surface">{habit.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-on-surface-variant">{habit.duration} • {habit.category}</span>
                      {habit.streak > 0 && (
                        <div className={`flex items-center gap-1 ${habit.done ? 'text-primary' : 'text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-[16px]" style={habit.done ? {fontVariationSettings:"'FILL' 1"} : {}}>local_fire_department</span>
                          <span className="text-xs font-bold">{habit.streak} Day Streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleHabit(habit.id)}
                  disabled={toggling === habit.id}
                  className={`w-10 h-10 rounded-full border-4 flex items-center justify-center cursor-pointer active:scale-90 transition-all duration-200 disabled:opacity-60 ${
                    habit.done
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-secondary-container bg-surface-container-lowest text-secondary-container hover:bg-secondary-container hover:text-white'
                  }`}
                >
                  {toggling === habit.id
                    ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : habit.done && <span className="material-symbols-outlined text-[24px]">check</span>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Suggestion Banner */}
      <section className="mt-8 flex flex-col items-center text-center p-8 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant">
        <span className="material-symbols-outlined text-[48px] text-primary opacity-50 mb-3">local_florist</span>
        <h3 className="text-2xl font-semibold text-primary mb-2">Feeling energized?</h3>
        <p className="text-base text-on-surface-variant mb-5 max-w-sm">
          Consistency is the foundation of growth. Every habit you check off is a vote for who you're becoming.
        </p>
        <button onClick={() => setShowModal(true)} className="bg-secondary text-on-secondary px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Add a New Habit
        </button>
      </section>
    </div>
  );
}
