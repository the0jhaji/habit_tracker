import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const CATEGORIES = ['All', 'Mindfulness', 'Fitness', 'Nutrition', 'Learning', 'Sleep'];

const CATALOG_HABITS = [
  { id: 1, name: 'Morning Meditation', category: 'Mindfulness', duration: '10 min', difficulty: 'Easy', icon: 'self_improvement', color: 'bg-secondary-fixed text-primary', users: '12.4k', desc: 'Start your day with clarity and calm through guided mindfulness.' },
  { id: 2, name: 'Evening Yoga', category: 'Fitness', duration: '20 min', difficulty: 'Medium', icon: 'fitness_center', color: 'bg-primary-fixed text-on-primary-fixed', users: '9.1k', desc: 'Release tension and improve flexibility with a gentle yoga flow.' },
  { id: 3, name: 'Read 20 Pages', category: 'Learning', duration: '25 min', difficulty: 'Easy', icon: 'menu_book', color: 'bg-tertiary-fixed text-on-tertiary-fixed', users: '18.3k', desc: 'Build a daily reading habit to expand your knowledge consistently.' },
  { id: 4, name: 'Drink 2L Water', category: 'Nutrition', duration: 'All day', difficulty: 'Easy', icon: 'water_drop', color: 'bg-secondary-container text-on-secondary-container', users: '34.2k', desc: 'Stay hydrated throughout the day for optimal body function.' },
  { id: 5, name: 'Cold Shower', category: 'Fitness', duration: '5 min', difficulty: 'Hard', icon: 'shower', color: 'bg-primary-fixed-dim text-on-primary-fixed', users: '6.7k', desc: 'Boost energy, focus, and resilience with a daily cold shower.' },
  { id: 6, name: 'Journaling', category: 'Mindfulness', duration: '15 min', difficulty: 'Easy', icon: 'edit_note', color: 'bg-tertiary-container/30 text-on-tertiary-container', users: '21.5k', desc: 'Reflect on your day and track your emotional well-being.' },
  { id: 7, name: 'Sleep by 10PM', category: 'Sleep', duration: 'Evening', difficulty: 'Medium', icon: 'nightlight', color: 'bg-secondary-fixed text-primary', users: '15.8k', desc: 'Optimize your sleep schedule for better recovery and energy.' },
  { id: 8, name: 'No-Sugar Day', category: 'Nutrition', duration: 'All day', difficulty: 'Hard', icon: 'no_food', color: 'bg-error-container text-on-error-container', users: '4.2k', desc: 'Eliminate refined sugar for a day to reset your energy levels.' },
];

const DIFFICULTY_COLOR = {
  Easy: 'bg-secondary-container text-on-secondary-container',
  Medium: 'bg-primary-fixed text-on-primary-fixed',
  Hard: 'bg-error-container text-on-error-container',
};

export default function Catalog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [trackedHabits, setTrackedHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getHabits();
      setTrackedHabits(data);
    } catch (err) {
      console.error('Failed to load tracked habits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = CATALOG_HABITS.filter(h => {
    const matchCat = activeCategory === 'All' || h.category === activeCategory;
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggle = async (catalogHabit) => {
    const existing = trackedHabits.find(h => h.name.toLowerCase() === catalogHabit.name.toLowerCase());
    setTogglingId(catalogHabit.id);
    try {
      if (existing) {
        // Delete it
        await api.deleteHabit(existing.id);
        setTrackedHabits(prev => prev.filter(h => h.id !== existing.id));
      } else {
        // Create it
        const newHabit = await api.createHabit({
          name: catalogHabit.name,
          category: catalogHabit.category,
          duration: catalogHabit.duration,
          icon: catalogHabit.icon
        });
        setTrackedHabits(prev => [...prev, newHabit]);
      }
    } catch (err) {
      console.error('Failed to toggle catalog habit:', err);
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-on-surface-variant text-sm">Loading catalog…</p>
      </div>
    );
  }

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">Habit Catalog</h1>
        <p className="text-lg text-on-surface-variant max-w-xl">
          Discover science-backed habits to build into your daily routine. Start small, stay consistent.
        </p>
      </section>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          type="text"
          placeholder="Search habits..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors text-base"
        />
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(habit => {
          const isAdded = trackedHabits.some(h => h.name.toLowerCase() === habit.name.toLowerCase());
          const isToggling = togglingId === habit.id;

          return (
            <div
              key={habit.id}
              className="bg-surface-container-lowest custom-card-shadow rounded-xl p-5 flex gap-4 hover:shadow-md transition-all group"
            >
              <div className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center ${habit.color}`}>
                <span className="material-symbols-outlined text-[28px]" data-icon={habit.icon}>{habit.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-base font-semibold text-on-surface">{habit.name}</h3>
                  <button
                    onClick={() => toggle(habit)}
                    disabled={isToggling}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 ${
                      isAdded
                        ? 'bg-primary border-primary text-on-primary'
                        : 'border-outline text-outline hover:border-primary hover:text-primary'
                    }`}
                  >
                    {isToggling ? (
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">{isAdded ? 'check' : 'add'}</span>
                    )}
                  </button>
                </div>
                <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">{habit.desc}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[habit.difficulty]}`}>{habit.difficulty}</span>
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {habit.duration}
                  </span>
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {habit.users} doing this
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-[64px] mb-4 block opacity-30">search_off</span>
            <p className="text-lg">No habits found for your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
