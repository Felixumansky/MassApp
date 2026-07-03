const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE = RAW_BASE.endsWith('/api') ? RAW_BASE.slice(0, -4) : RAW_BASE;

const GENERIC_ERROR = 'משהו השתבש. נסו שוב בעוד רגע.';

// מציג ללקוח רק הודעות נעימות בעברית. הודעות טכניות (אנגלית/stack/fetch failed)
// שמגיעות בטעות מהשרת או מהתשתית מוחלפות בהודעה כללית, כדי שלא ייחשפו למשתמש.
function friendlyMessage(raw) {
  const msg = String(raw || '').trim();
  if (!msg) return GENERIC_ERROR;
  const technical = /fetch failed|typeerror|referenceerror|undefined|null|econn|enotfound|timeout|stack|at \w|<!doctype|status code|\b5\d\d\b/i;
  // הודעה נחשבת ידידותית רק אם היא בעברית ולא נראית טכנית.
  if (/[֐-׿]/.test(msg) && !technical.test(msg)) return msg;
  return GENERIC_ERROR;
}

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
    throw new Error('אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(friendlyMessage(data.error));
  return data;
}

export const api = {
  register: (email, password) => req('/api/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) => req('/api/auth/login', { method: 'POST', body: { email, password } }),
  logout: (token) => req('/api/auth/logout', { method: 'POST', token }).catch(() => {}),
  getState: (token) => req('/api/state', { token }),
  putState: (token, state) => req('/api/state', { method: 'PUT', token, body: state }),
};

// URL for an exercise demonstration GIF, proxied through MassAPI (keeps the
// RapidAPI key server-side). Returns '' when the exercise has no media id.
export const exerciseMediaUrl = (mediaId) =>
  mediaId ? `${BASE}/api/exercise-media/${encodeURIComponent(mediaId)}` : '';
