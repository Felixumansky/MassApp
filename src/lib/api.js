const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function req(path, { method = 'GET', token, body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('אין חיבור לשרת');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאת שרת');
  return data;
}

export const api = {
  register: (email, password) => req('/api/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => req('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: (token) => req('/api/auth/logout', { method: 'POST', token }).catch(() => {}),
  getState: (token) => req('/api/state', { token }),
  putState: (token, state) => req('/api/state', { method: 'PUT', token, body: state }),
};
