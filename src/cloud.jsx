import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { useStore } from './store.jsx';
import { biometricEnabled, registerBiometric, verifyBiometric, disableBiometric } from './lib/biometric.js';

const AUTH_KEY = 'liftlog.auth';
const UNLOCK_KEY = 'liftlog.unlockUntil'; // remember a biometric unlock for a while
const MONTH_MS = 30 * 864e5; // keep the session alive for a month
const Ctx = createContext(null);

/** Did the user unlock recently enough that we can skip the fingerprint prompt? */
function unlockFresh() {
  const until = Number(localStorage.getItem(UNLOCK_KEY));
  return until > Date.now();
}

/** Remember that the session is unlocked for the next month. */
function rememberUnlock() {
  localStorage.setItem(UNLOCK_KEY, String(Date.now() + MONTH_MS));
}

function clearUnlock() {
  localStorage.removeItem(UNLOCK_KEY);
}

function loadAuth() {
  try {
    const a = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (!a?.token) return null;
    if (a.exp && Date.now() > a.exp) {
      localStorage.removeItem(AUTH_KEY); // expired — force a fresh login
      clearUnlock();
      return null;
    }
    return a;
  } catch {
    return null;
  }
}

function shouldLockSavedSession() {
  return !!(loadAuth() && biometricEnabled() && !unlockFresh());
}

function byId(items = []) {
  const map = new Map();
  for (const item of items || []) {
    if (item?.id) map.set(item.id, item);
  }
  return map;
}

function mergeList(local = [], remote = []) {
  return [...new Map([...byId(remote), ...byId(local)]).values()];
}

/** One body-weight entry per date: the local version wins over a stale server copy. */
function mergeWeights(local = [], remote = [], isDeleted) {
  const localByDate = new Map(local.map((b) => [b.date, b.id]));
  const byDate = new Map();
  for (const b of mergeList(local, remote)) {
    if (isDeleted(b)) continue;
    const preferredId = localByDate.get(b.date);
    if (!byDate.has(b.date) || b.id === preferredId) byDate.set(b.date, b);
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

function mergeSyncedState(local, remote = {}) {
  // Union of tombstones from both sides, so a delete made on any device sticks
  // instead of being resurrected by the id-union merge below.
  const deletedIds = new Set([...(local.deletedIds || []), ...(remote.deletedIds || [])]);
  const alive = (item) => !deletedIds.has(item.id);
  return {
    profile: Object.keys(remote.profile || {}).length ? { ...local.profile, ...remote.profile } : local.profile,
    workouts: mergeList(local.workouts, remote.workouts).filter(alive).sort((a, b) => (a.date < b.date ? 1 : -1)),
    routines: mergeList(local.routines, remote.routines).filter(alive),
    bodyWeights: mergeWeights(local.bodyWeights, remote.bodyWeights, (b) => !alive(b)),
    customExercises: mergeList(local.customExercises, remote.customExercises).filter(alive),
    deletedIds: [...deletedIds].slice(-1000),
  };
}

/** Cloud auth + merge-on-pull state sync layered on top of the local store. */
export function CloudProvider({ children }) {
  const { state, dispatch } = useStore();
  const [auth, setAuth] = useState(loadAuth); // { token, user, exp } | null
  // Gate the UI behind biometrics when a remembered session is protected.
  const [locked, setLocked] = useState(shouldLockSavedSession);
  const [bioOn, setBioOn] = useState(biometricEnabled);
  const [status, setStatus] = useState('idle'); // idle | syncing | synced | error
  const [error, setError] = useState('');
  const ready = useRef(false); // gate pushes until initial pull/push done
  const [readyVersion, setReadyVersion] = useState(0);
  const pushTimer = useRef(null);
  const retryTimer = useRef(null);
  const latestSlice = useRef(null);
  const dirty = useRef(false); // changes not yet pushed to the server

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
      deletedIds: state.deletedIds || [],
    }),
    [state.profile, state.workouts, state.routines, state.bodyWeights, state.customExercises, state.deletedIds]
  );
  const sliceKey = JSON.stringify(slice);
  latestSlice.current = slice;

  const markReady = useCallback(() => {
    ready.current = true;
    setReadyVersion((v) => v + 1);
  }, []);

  // After auth, reconcile: pull server state, or seed it from local if empty.
  const reconcile = useCallback(
    async (token) => {
      setStatus('syncing');
      setError('');
      try {
        const { state: server, updatedAt } = await api.getState(token);
        const local = latestSlice.current || slice;
        if (updatedAt && (server.workouts?.length || server.routines?.length || server.bodyWeights?.length || server.customExercises?.length)) {
          const merged = mergeSyncedState(local, server);
          dispatch({ type: 'replaceAll', data: merged });
          await api.putState(token, merged);
        } else {
          await api.putState(token, local);
        }
        markReady();
        setStatus('synced');
      } catch (e) {
        setStatus('error');
        setError(e.message);
      }
    },
    [dispatch, markReady, slice]
  );

  async function login(email, password) {
    setError('');
    const { token, user } = await api.login(email, password);
    persistAuth({ token, user });
    rememberUnlock();
    setLocked(false);
    await reconcile(token);
  }

  async function register(email, password) {
    setError('');
    const { token, user } = await api.register(email, password);
    persistAuth({ token, user });
    rememberUnlock();
    setLocked(false);
    await reconcile(token);
  }

  function logout() {
    if (auth?.token) api.logout(auth.token);
    ready.current = false;
    persistAuth(null);
    clearUnlock();
    disableBiometric(); // nothing left to unlock
    setBioOn(false);
    setLocked(false);
    setStatus('idle');
  }

  async function replaceCloudState(nextSlice) {
    if (!auth?.token) return;
    clearTimeout(pushTimer.current);
    clearTimeout(retryTimer.current);
    ready.current = false;
    setStatus('syncing');
    setError('');
    try {
      await api.putState(auth.token, nextSlice);
      markReady();
      setStatus('synced');
    } catch (e) {
      markReady();
      setStatus('error');
      setError(e.message);
      throw e;
    }
  }

  // Enroll the device fingerprint/face for quick unlock next time.
  async function enableBiometric() {
    if (!auth?.user) throw new Error('יש להתחבר תחילה');
    await registerBiometric(auth.user);
    rememberUnlock();
    setBioOn(true);
  }

  function turnOffBiometric() {
    disableBiometric();
    clearUnlock();
    setBioOn(false);
  }

  // Unlock a remembered session with the device biometric.
  async function unlock() {
    await verifyBiometric(); // throws if it fails / is cancelled
    rememberUnlock();
    setLocked(false);
    if (auth?.token && !ready.current) reconcile(auth.token);
  }

  // On first mount with a saved token, reconcile (unless waiting on unlock).
  useEffect(() => {
    if (!locked && auth?.token && !ready.current) reconcile(auth.token);
  }, []);

  // Debounced push whenever the synced slice changes.
  useEffect(() => {
    if (!auth?.token || !ready.current) return undefined;
    setStatus('syncing');
    dirty.current = true;
    clearTimeout(pushTimer.current);
    clearTimeout(retryTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await api.putState(auth.token, latestSlice.current);
        dirty.current = false;
        setStatus('synced');
      } catch (e) {
        setStatus('error');
        setError(e.message);
        retryTimer.current = setTimeout(async () => {
          try {
            setStatus('syncing');
            await api.putState(auth.token, latestSlice.current);
            dirty.current = false;
            setStatus('synced');
          } catch (retryErr) {
            setStatus('error');
            setError(retryErr.message);
          }
        }, 5000);
      }
    }, 900);
    return () => {
      clearTimeout(pushTimer.current);
      clearTimeout(retryTimer.current);
    };
  }, [sliceKey, auth?.token, readyVersion]);

  // Going to background: flush a pending push right away — the 900ms debounce
  // loses the last change when the app is closed straight after it. Coming back
  // to foreground: retry the initial reconcile if it failed (otherwise the whole
  // session would silently never sync).
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden') {
        if (auth?.token && !locked && !ready.current) reconcile(auth.token);
        return;
      }
      if (!auth?.token || !ready.current || !dirty.current) return;
      clearTimeout(pushTimer.current);
      clearTimeout(retryTimer.current);
      api
        .putState(auth.token, latestSlice.current)
        .then(() => {
          dirty.current = false;
          setStatus('synced');
        })
        .catch(() => {}); // the debounced retry path will pick it up next time
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [auth?.token, locked, reconcile]);

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
      replaceCloudState,
    }),
    [auth, status, error, locked, bioOn]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCloud() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCloud must be used within CloudProvider');
  return ctx;
}
