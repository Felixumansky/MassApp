const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאת תקשורת עם השרת');
  return data;
}

export const todayStr = () => new Date().toLocaleDateString('en-CA');

export const api = {
  health: () => request('/health'),
  summary: (date) => request(`/summary?date=${date}`),
  history: (days = 7) => request(`/history?days=${days}`),
  insights: (days = 30, end = todayStr()) => request(`/insights?days=${days}&end=${end}`),
  profile: {
    get: () => request('/profile'),
    update: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  foods: {
    list: (q = '', signal) => request(`/foods?q=${encodeURIComponent(q)}`, { signal }),
    create: (body) => request('/foods', { method: 'POST', body: JSON.stringify(body) }),
  },
  meals: {
    list: (date) => request(`/meals?date=${date}`),
    create: (body) => request('/meals', { method: 'POST', body: JSON.stringify(body) }),
    duplicate: (id, date) => request(`/meals/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ date }) }),
    duplicateDay: (sourceDate, targetDate) => request('/meals/duplicate-day', {
      method: 'POST',
      body: JSON.stringify({ source_date: sourceDate, target_date: targetDate }),
    }),
    remove: (id) => request(`/meals/${id}`, { method: 'DELETE' }),
  },
  water: {
    create: (body) => request('/water', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/water/${id}`, { method: 'DELETE' }),
  },
  weights: {
    list: () => request('/weights'),
    create: (body) => request('/weights', { method: 'POST', body: JSON.stringify(body) }),
  },
  checkins: {
    get: (date) => request(`/checkins?date=${date}`),
    update: (body) => request('/checkins', { method: 'PUT', body: JSON.stringify(body) }),
  },
};
