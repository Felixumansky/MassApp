import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { useStore } from './store.jsx';
import { biometricEnabled, registerBiometric, verifyBiometric, disableBiometric } from './lib/biometric.js';

const AUTH_KEY = 'liftlog.auth';
const MONTH_MS = 30 * 864e5; // keep the session alive for a month
const Ctx = createContext(null);

function loadAuth() {
  try {
    const a = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (!a?.token) return null;
    if (a.exp && Date.now() > a.exp) {
      localStorage.removeItem(AUTH_KEY); // expired — force a fresh login
      return null;
    }
    return a;
  } catch {
    return null;
  }
}

/** Cloud auth + last-write-wins state sync layered on top of the local store. */
export function CloudProvider({ children }) {
  const { state, dispatch } = useStore();
  const [auth, setAuth] = useState(loadAuth); // { token, user, exp } | null
  // Gate the UI behind biometrics when a remembered session is protected.
  const [locked, setLocked] = useState(() => !!(loadAuth() && biometricEnabled()));
  const [bioOn, setBioOn] = useState(biometricEnabled);
  const [status, setStatus] = useState('idle'); // idle | syncing | synced | error
  const [error, setError] = useState('');
  const ready = useRef(false); // gate pushes until initial pull/push done
  const pushTimer = useRef(null);

  const persistAuth = useCallback((next) => {
    if (next) {
      const withExp = { ...next, exp: next.exp || Date.now() + MONTH_MS };
      setAuth(withExp);
      localStorage.setItem(AUTH_KEY, JSON.stringify(withExp));
    } else {
      setAuth(null);
      localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  // The slice we sync (in-progress workout stays local-only).
  const slice = useMemo(
    () => ({
      profile: state.profile,
      workouts: state.workouts,
      routines: state.routines,
      bodyWeights: state.bodyWeights,
      customExercises: state.customExercises,
    }),
    [state.profile, state.workouts, state.routines, state.bodyWeights, state.customExercises]
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
    setLocked(false);
    await reconcile(token);
  }

  async function register(email, password) {
    setError('');
    const { token, user } = await api.register(email, password);
    persistAuth({ token, user });
    setLocked(false);
    await reconcile(token);
  }

  function logout() {
    if (auth?.token) api.logout(auth.token);
    ready.current = false;
    persistAuth(null);
    disableBiometric(); // nothing left to unlock
    setBioOn(false);
    setLocked(false);
    setStatus('idle');
  }

  // Enroll the device fingerprint/face for quick unlock next time.
  async function enableBiometric() {
    if (!auth?.user) throw new Error('יש להתחבר תחילה');
    await registerBiometric(auth.user);
    setBioOn(true);
  }

  function turnOffBiometric() {
    disableBiometric();
    setBioOn(false);
  }

  // Unlock a remembered session with the device biometric.
  async function unlock() {
    await verifyBiometric(); // throws if it fails / is cancelled
    setLocked(false);
    if (auth?.token && !ready.current) reconcile(auth.token);
  }

  // On first mount with a saved token, reconcile (unless waiting on unlock).
  useEffect(() => {
    if (!locked && auth?.token && !ready.current) reconcile(auth.token);
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
    () => ({
      user: auth?.user || null,
      status,
      error,
      login,
      register,
      logout,
      locked,
      unlock,
      lockedEmail: auth?.user?.email || '',
      bioOn,
      enableBiometric,
      disableBiometric: turnOffBiometric,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auth, status, error, locked, bioOn]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCloud() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCloud must be used within CloudProvider');
  return ctx;
}
