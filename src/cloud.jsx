import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { useStore } from './store.jsx';

const AUTH_KEY = 'liftlog.auth';
const Ctx = createContext(null);

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
  } catch {
    return null;
  }
}

/** Cloud auth + last-write-wins state sync layered on top of the local store. */
export function CloudProvider({ children }) {
  const { state, dispatch } = useStore();
  const [auth, setAuth] = useState(loadAuth); // { token, user } | null
  const [status, setStatus] = useState('idle'); // idle | syncing | synced | error
  const [error, setError] = useState('');
  const ready = useRef(false); // gate pushes until initial pull/push done
  const pushTimer = useRef(null);

  const persistAuth = useCallback((next) => {
    setAuth(next);
    if (next) localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    else localStorage.removeItem(AUTH_KEY);
  }, []);

  // The slice we sync (in-progress workout stays local-only).
  const slice = useMemo(
    () => ({
      profile: state.profile,
      workouts: state.workouts,
      routines: state.routines,
      bodyWeights: state.bodyWeights,
    }),
    [state.profile, state.workouts, state.routines, state.bodyWeights]
  );
  const sliceKey = JSON.stringify(slice);

  // After auth, reconcile: pull server state, or seed it from local if empty.
  const reconcile = useCallback(
    async (token) => {
      setStatus('syncing');
      setError('');
      try {
        const { state: server, updatedAt } = await api.getState(token);
        if (updatedAt && (server.workouts?.length || server.routines?.length || server.bodyWeights?.length)) {
          dispatch({ type: 'replaceAll', data: server });
        } else {
          await api.putState(token, slice);
        }
        ready.current = true;
        setStatus('synced');
      } catch (e) {
        setStatus('error');
        setError(e.message);
      }
    },
    [dispatch, slice]
  );

  async function login(email, password) {
    setError('');
    const { token, user } = await api.login(email, password);
    persistAuth({ token, user });
    await reconcile(token);
  }

  async function register(email, password) {
    setError('');
    const { token, user } = await api.register(email, password);
    persistAuth({ token, user });
    await reconcile(token);
  }

  function logout() {
    if (auth?.token) api.logout(auth.token);
    ready.current = false;
    persistAuth(null);
    setStatus('idle');
  }

  // On first mount with a saved token, reconcile.
  useEffect(() => {
    if (auth?.token && !ready.current) reconcile(auth.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push whenever the synced slice changes.
  useEffect(() => {
    if (!auth?.token || !ready.current) return undefined;
    setStatus('syncing');
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await api.putState(auth.token, slice);
        setStatus('synced');
      } catch (e) {
        setStatus('error');
        setError(e.message);
      }
    }, 900);
    return () => clearTimeout(pushTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliceKey, auth?.token]);

  const value = useMemo(
    () => ({ user: auth?.user || null, status, error, login, register, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auth, status, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCloud() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCloud must be used within CloudProvider');
  return ctx;
}
