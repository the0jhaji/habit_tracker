const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Habits
  getHabits: (date) => request(`/habits${date ? `?date=${date}` : ''}`),
  createHabit: (data) => request('/habits', { method: 'POST', body: data }),
  updateHabit: (id, data) => request(`/habits/${id}`, { method: 'PUT', body: data }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  toggleHabit: (id, date) => request(`/habits/${id}/toggle`, { method: 'POST', body: { date } }),
  resetHabits: () => request('/habits/reset', { method: 'POST' }),

  // Stats
  getStats: (date) => request(`/stats${date ? `?date=${date}` : ''}`),
};
