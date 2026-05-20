import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AddHabitModal from './AddHabitModal';

export default function Layout() {
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);

  // Apply dark mode & theme variables globally on mount and settings update
  useEffect(() => {
    const applyTheme = () => {
      try {
        const saved = localStorage.getItem('daycount-settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          if (parsed.theme && parsed.theme !== 'Serene Green') {
            document.documentElement.setAttribute('data-theme', parsed.theme);
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
        }
      } catch (e) {
        console.error('Failed to apply global settings theme:', e);
      }
    };

    // Apply immediately
    applyTheme();

    // Listen to settings update events and storage events
    window.addEventListener('settings-updated', applyTheme);
    window.addEventListener('storage', applyTheme);

    return () => {
      window.removeEventListener('settings-updated', applyTheme);
      window.removeEventListener('storage', applyTheme);
    };
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Habit Catalog', path: '/catalog', icon: 'explore', short: 'Explore' },
    { name: 'Analytics', path: '/analytics', icon: 'leaderboard', short: 'Stats' },
    { name: 'Settings', path: '/settings', icon: 'settings', short: 'Settings' }
  ];

  return (
    <div className="text-on-surface bg-background min-h-screen">
      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} />}

      {/* Top Navigation Shell */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-10 py-4 bg-surface shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl md:text-3xl font-bold text-primary">DayCount</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`font-body-md text-base px-2 py-1 rounded transition-colors ${
                location.pathname === link.path
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary p-2 hover:bg-surface-container-low rounded-full transition-colors" data-icon="notifications">
            notifications
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full font-label-md text-sm active:scale-95 duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
            <span>Add Habit</span>
          </button>
        </div>
      </header>

      {/* Side Navigation Shell (Desktop Only) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col p-4 gap-4 pt-24">
        <div className="flex flex-col gap-2 mb-6">
          <span className="font-display text-2xl font-bold text-primary">DayCount</span>
          <span className="font-label-md text-sm text-on-surface-variant">Stay Grounded</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined" data-icon={link.icon}>{link.icon}</span>
                <span className="font-label-md text-sm">{link.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-auto bg-primary text-on-primary py-4 rounded-xl font-headline-md text-base font-bold active:opacity-80 active:scale-95 duration-150 transition-all"
        >
          New Goal
        </button>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-24 pb-24 md:pb-12 px-5 md:px-10 max-w-[1200px] mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Shell (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-center py-3 z-50">
        {navLinks.slice(0, 2).map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" data-icon={link.icon} style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>{link.icon}</span>
              <span className="font-label-sm text-[10px]">{link.short || link.name}</span>
            </Link>
          );
        })}

        <div className="relative -top-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg active:scale-90 duration-150 transition-transform"
          >
            <span className="material-symbols-outlined text-[32px]" data-icon="add">add</span>
          </button>
        </div>

        {navLinks.slice(2).map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined" data-icon={link.icon} style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>{link.icon}</span>
              <span className="font-label-sm text-[10px]">{link.short || link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Contextual FAB (Desktop only) */}
      <div className="hidden md:flex fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform group"
        >
          <span className="material-symbols-outlined text-[28px]" data-icon="add">add</span>
          <span className="absolute right-full mr-4 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Add Habit</span>
        </button>
      </div>
    </div>
  );
}
