const BASE = '/api';

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
  profile: {
    get: () => request('/profile'),
    update: (body) => request('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },
  foods: {
    list: (q = '') => request(`/foods?q=${encodeURIComponent(q)}`),
    create: (body) => request('/foods', { method: 'POST', body: JSON.stringify(body) }),
  },
  meals: {
    create: (body) => request('/meals', { method: 'POST', body: JSON.stringify(body) }),
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
};
