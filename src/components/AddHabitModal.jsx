import { useState } from 'react';
import { api } from '../api';

export default function AddHabitModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', icon: 'check_circle', category: 'General', duration: 'Daily' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const ICONS = ['check_circle', 'self_improvement', 'water_drop', 'menu_book', 'fitness_center', 'nightlight', 'edit_note', 'directions_run'];
  const CATS = ['General', 'Mindfulness', 'Fitness', 'Nutrition', 'Learning', 'Sleep'];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Habit name is required');
    setSaving(true);
    try {
      const habit = await api.createHabit(form);
      if (onAdded) onAdded(habit);
      window.dispatchEvent(new CustomEvent('habit-added', { detail: habit }));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl text-on-surface"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-primary">Add New Habit</h2>
          <button type="button" onClick={onClose} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
        </div>

        {error && <div className="text-sm text-error bg-error-container px-3 py-2 rounded-lg mb-4">{error}</div>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">Name</label>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Morning Walk"
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary text-sm"
            >
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1 block">Duration</label>
            <input
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 10 min"
              className="w-full px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Adding...' : 'Add Habit'}
          </button>
        </div>
      </form>
    </div>
  );
}
