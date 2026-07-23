import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { useStore } from './store.jsx';
import { mergeLocalStateIntoServer } from './lib/cloudState.js';
import { biometricEnabled, registerBiometric, verifyBiometric, disableBiometric } from './lib/biometric.js';

const AUTH_KEY = 'liftlog.auth';
const UNLOCK_KEY = 'liftlog.unlockUntil'; // remember a biometric unlock for a while
const CACHE_KEY = 'liftlog.stateCache'; // last synced slice, for instant startup
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

// Local mirror of the last synced slice. The DB stays the single source of
// truth — this only lets the UI render real data immediately on launch while
// the server pull runs in the background.
function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function saveCache(slice) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(slice));
  } catch {
    // Quota exceeded — skip; the next app open just falls back to the server pull.
  }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

/** Cloud auth + DB-backed state: pull the state from the server, push every change. */
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
  const pendingPush = useRef(null);
  const pushInFlight = useRef(false);
  const pushGeneration = useRef(0);
  const dirty = useRef(false); // changes not yet pushed to the server
  const prevSliceKey = useRef(null); // detects real slice changes for the pre-sync mirror

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
      exerciseImages: state.exerciseImages || {},
      meals: state.meals || [],
      waterLogs: state.waterLogs || [],
      customFoods: state.customFoods || [],
      nutritionGoals: state.nutritionGoals,
      deletedIds: state.deletedIds || [],
    }),
    [state.profile, state.workouts, state.routines, state.bodyWeights, state.customExercises, state.exerciseImages, state.meals, state.waterLogs, state.customFoods, state.nutritionGoals, state.deletedIds]
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
        const { state: server, hasState } = await api.getState(token);
        const reconciledServer = mergeLocalStateIntoServer(server, latestSlice.current || slice);
        const hasServerData =
          hasState ||
          reconciledServer.workouts?.length ||
            reconciledServer.routines?.length ||
            reconciledServer.bodyWeights?.length ||
            reconciledServer.customExercises?.length ||
            reconciledServer.meals?.length ||
            reconciledServer.waterLogs?.length ||
            reconciledServer.customFoods?.length;
        if (hasServerData) {
          // The DB is authoritative for the pulled state; retain only items
          // created locally after the pull began so they are not discarded.
          dispatch({ type: 'replaceAll', data: reconciledServer });
          saveCache(reconciledServer);
        } else {
          // Empty account: seed the DB from the current in-memory (starter) state.
          await api.putState(token, latestSlice.current || slice);
          saveCache(latestSlice.current || slice);
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
    // Cancel any in-flight/debounced pushes so a stale timer can't upload the
    // about-to-be-cleared (seed) slice over the server's real data.
    clearTimeout(pushTimer.current);
    clearTimeout(retryTimer.current);
    ready.current = false;
    dirty.current = false;
    persistAuth(null);
    clearUnlock();
    disableBiometric(); // nothing left to unlock
    setBioOn(false);
    setLocked(false);
    setStatus('idle');
    // Wipe the local cache — otherwise this device keeps showing the logged-out
    // user's workouts/routines (privacy on shared devices), and a stale copy can
    // resurface a deleted workout that the cloud has already tombstoned.
    clearCache();
    dispatch({ type: 'resetAll' });
  }

  async function replaceCloudState(nextSlice) {
    if (!auth?.token) return;
    clearTimeout(pushTimer.current);
    clearTimeout(retryTimer.current);
    pendingPush.current = null;
    pushGeneration.current += 1;
    ready.current = false;
    setStatus('syncing');
    setError('');
    try {
      await api.putState(auth.token, nextSlice);
      saveCache(nextSlice);
      markReady();
      setStatus('synced');
    } catch (e) {
      markReady();
      setStatus('error');
      setError(e.message);
      throw e;
    }
  }

  async function drainPushQueue() {
    if (pushInFlight.current) return;
    const job = pendingPush.current;
    if (!job) return;

    pendingPush.current = null;
    pushInFlight.current = true;
    try {
      saveCache(job.slice);
      await api.putState(job.token, job.slice);
      dirty.current = Boolean(pendingPush.current);
      if (job.generation === pushGeneration.current) {
        setStatus('synced');
        setError('');
      }
    } catch (e) {
      // If a newer snapshot is already queued, send that one instead of
      // retrying this stale snapshot. Otherwise retry the failed snapshot.
      if (job.generation === pushGeneration.current && !pendingPush.current) {
        setStatus('error');
        setError(e.message);
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          pendingPush.current = job;
          drainPushQueue();
        }, 5000);
      }
    } finally {
      pushInFlight.current = false;
      if (pendingPush.current) drainPushQueue();
    }
  }

  function enqueuePush(token, nextSlice) {
    const generation = ++pushGeneration.current;
    pendingPush.current = { token, slice: nextSlice, generation };
    clearTimeout(retryTimer.current);
    retryTimer.current = null;
    drainPushQueue();
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

  // On first mount with a saved token: hydrate instantly from the local mirror
  // (the LockScreen still gates the UI when locked), then reconcile with the
  // server in the background (unless waiting on unlock). Pushes stay gated on
  // `ready`, so the cached copy can never overwrite fresher server data.
  useEffect(() => {
    if (!auth?.token) return;
    const cached = loadCache();
    if (cached) dispatch({ type: 'replaceAll', data: cached });
    if (!locked && !ready.current) reconcile(auth.token);
  }, []);

  // Edits made before the initial pull completes (offline launch / server down)
  // can't be pushed yet — mirror them into the cache so killing the app doesn't
  // lose them. The next successful reconcile merges them into the server state
  // (mergeLocalStateIntoServer), so nothing here can overwrite fresher data.
  useEffect(() => {
    const prev = prevSliceKey.current;
    prevSliceKey.current = sliceKey;
    if (prev === null || prev === sliceKey) return; // initial render, not an edit
    if (!auth?.token || ready.current) return; // once synced, pushes own the cache
    saveCache(latestSlice.current);
  }, [sliceKey, auth?.token]);

  // Debounced push whenever the synced slice changes.
  useEffect(() => {
    if (!auth?.token || !ready.current) return undefined;
    setStatus('syncing');
    dirty.current = true;
    clearTimeout(pushTimer.current);
    clearTimeout(retryTimer.current);
    pushTimer.current = setTimeout(async () => {
      enqueuePush(auth.token, latestSlice.current);
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
      enqueuePush(auth.token, latestSlice.current);
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
      token: auth?.token || null, // לקריאות API ישירות (למשל ניתוח תזונתי)
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
