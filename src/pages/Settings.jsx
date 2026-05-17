import { useState, useEffect } from 'react';
import { api } from '../api';

const TOGGLE = ({ on, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-300 ${on ? 'bg-primary' : 'bg-outline-variant'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SELECT = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    className="text-sm text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
  >
    {options.map(o => <option key={o}>{o}</option>)}
  </select>
);

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('daycount-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    return {
      notifications: true,
      streakReminders: true,
      weeklyReport: false,
      darkMode: false,
      sound: true,
      reminderTime: '08:00',
      language: 'English',
      theme: 'Serene Green',
      weekStart: 'Monday',
    };
  });

  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Persist settings & apply styles
  useEffect(() => {
    localStorage.setItem('daycount-settings', JSON.stringify(settings));

    // Dark Mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Theme Selector
    if (settings.theme === 'Serene Green') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings]);

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  // Export Habits Data as CSV
  const handleExport = async () => {
    try {
      const habits = await api.getHabits();
      if (!habits || habits.length === 0) {
        alert('No habits available to export!');
        return;
      }
      
      let csv = 'ID,Name,Category,Duration,Frequency,Created At,Done Today,Current Streak\n';
      habits.forEach(h => {
        csv += `${h.id},"${h.name.replace(/"/g, '""')}","${h.category}","${h.duration}","${h.frequency}",${h.created_at},${h.done},${h.streak}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `daycount_habits_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export habits data: ' + err.message);
    }
  };

  // Delete All Data
  const handleDeleteAll = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete ALL habits and progress logs? This action is completely irreversible.')) {
      return;
    }

    setResetting(true);
    try {
      await api.resetHabits();
      setSuccessMsg('All habit logs and habits purged successfully.');
      setTimeout(() => {
        setSuccessMsg('');
        window.location.href = '/'; // Redirect to dashboard
      }, 1500);
    } catch (err) {
      alert('Purge failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const Section = ({ title, children }) => (
    <div className="bg-surface-container-lowest custom-card-shadow rounded-xl p-6 mb-4">
      <h3 className="text-lg font-semibold text-primary mb-5">{title}</h3>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );

  const Row = ({ icon, label, sub, right }) => (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">{icon}</span>
        <div>
          <div className="text-sm font-medium text-on-surface">{label}</div>
          {sub && <div className="text-xs text-on-surface-variant">{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-2">Settings</h1>
        <p className="text-lg text-on-surface-variant max-w-xl">
          Customize your DayCount experience to fit your lifestyle.
        </p>
      </section>

      {successMsg && (
        <div className="bg-primary/20 text-primary border border-primary/30 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-secondary-container rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-bold select-none">A</div>
        <div className="flex-1">
          <div className="text-lg font-bold text-on-surface">Adarsh</div>
          <div className="text-sm text-on-surface-variant">adarsh@example.com</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>local_fire_department</span>
            <span className="text-xs text-primary font-semibold">Tracked habits streak active</span>
          </div>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">Edit</button>
      </div>

      <Section title="Notifications">
        <Row
          icon="notifications"
          label="Push Notifications"
          sub="Receive reminders for your habits"
          right={<TOGGLE on={settings.notifications} onToggle={() => set('notifications', !settings.notifications)} />}
        />
        <Row
          icon="local_fire_department"
          label="Streak Reminders"
          sub="Don't break your streak"
          right={<TOGGLE on={settings.streakReminders} onToggle={() => set('streakReminders', !settings.streakReminders)} />}
        />
        <Row
          icon="summarize"
          label="Weekly Progress Report"
          sub="Emailed every Sunday"
          right={<TOGGLE on={settings.weeklyReport} onToggle={() => set('weeklyReport', !settings.weeklyReport)} />}
        />
        <Row
          icon="schedule"
          label="Default Reminder Time"
          right={
            <input
              type="time"
              value={settings.reminderTime}
              onChange={e => set('reminderTime', e.target.value)}
              className="text-sm text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
            />
          }
        />
      </Section>

      <Section title="Appearance">
        <Row
          icon="dark_mode"
          label="Dark Mode"
          sub="Easier on the eyes at night"
          right={<TOGGLE on={settings.darkMode} onToggle={() => set('darkMode', !settings.darkMode)} />}
        />
        <Row
          icon="palette"
          label="Color Theme"
          right={<SELECT value={settings.theme} options={['Serene Green', 'Ocean Blue', 'Sunset Rose']} onChange={v => set('theme', v)} />}
        />
        <Row
          icon="volume_up"
          label="Completion Sound"
          sub="Play a sound when a habit is checked"
          right={<TOGGLE on={settings.sound} onToggle={() => set('sound', !settings.sound)} />}
        />
      </Section>

      <Section title="Preferences">
        <Row
          icon="translate"
          label="Language"
          right={<SELECT value={settings.language} options={['English', 'Spanish', 'French', 'German']} onChange={v => set('language', v)} />}
        />
        <Row
          icon="calendar_today"
          label="Week Starts On"
          right={<SELECT value={settings.weekStart} options={['Monday', 'Sunday', 'Saturday']} onChange={v => set('weekStart', v)} />}
        />
      </Section>

      <Section title="Data & Privacy">
        <Row
          icon="download"
          label="Export My Data"
          sub="Download your habit history as CSV"
          right={<button onClick={handleExport} className="text-sm text-primary font-medium hover:underline">Export</button>}
        />
        <Row
          icon="sync"
          label="Sync Across Devices"
          sub="Keep data updated everywhere"
          right={<TOGGLE on={true} onToggle={() => {}} />}
        />
        <Row
          icon="delete_forever"
          label="Delete All Data"
          sub="This action is irreversible"
          right={
            <button
              onClick={handleDeleteAll}
              disabled={resetting}
              className="text-sm text-error font-medium hover:underline disabled:opacity-50"
            >
              {resetting ? 'Deleting...' : 'Delete'}
            </button>
          }
        />
      </Section>

      <div className="text-center text-xs text-on-surface-variant mt-6 mb-2">
        DayCount v1.0.0 · Built with 🌿 Stitch + React
      </div>
    </div>
  );
}
