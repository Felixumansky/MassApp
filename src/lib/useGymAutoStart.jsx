import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';
import {
  canTriggerGymAutoStart,
  hasGymLocation,
  isInsideGymRadius,
  setGymAutoStartLastTriggered,
} from './gymAutoStart.js';
import { vibrate } from './utils.js';

function resolveRoutine(routines, routineId) {
  if (!routineId || routineId === 'free') return undefined;
  return routines.find((routine) => routine.id === routineId);
}

export function useGymAutoStart({ disabled = false } = {}) {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const watchIdRef = useRef(null);
  const triggeredInSessionRef = useRef(false);
  const config = state.profile.gymAutoStart;

  const ready = useMemo(
    () => !disabled && config?.enabled && hasGymLocation(config) && typeof navigator !== 'undefined' && 'geolocation' in navigator,
    [config, disabled]
  );

  useEffect(() => {
    if (!ready) {
      triggeredInSessionRef.current = false;
      return undefined;
    }

    function maybeStartWorkout(coords) {
      if (state.active || triggeredInSessionRef.current) return;
      const current = { latitude: coords.latitude, longitude: coords.longitude };
      if (!isInsideGymRadius(current, config) || !canTriggerGymAutoStart()) return;

      triggeredInSessionRef.current = true;
      setGymAutoStartLastTriggered();
      dispatch({ type: 'startWorkout', routine: resolveRoutine(state.routines, config.routineId) });
      vibrate([12, 40, 12]);
      if (location.pathname !== '/workout') navigate('/workout');
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => maybeStartWorkout(position.coords),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [config, dispatch, location.pathname, navigate, ready, state.active, state.routines]);

  useEffect(() => {
    function handleNativeGymEnter() {
      if (disabled || state.active || !config?.enabled || !canTriggerGymAutoStart()) return;
      setGymAutoStartLastTriggered();
      dispatch({ type: 'startWorkout', routine: resolveRoutine(state.routines, config.routineId) });
      if (location.pathname !== '/workout') navigate('/workout');
    }

    window.addEventListener('massapp:gym-enter', handleNativeGymEnter);
    return () => window.removeEventListener('massapp:gym-enter', handleNativeGymEnter);
  }, [config, disabled, dispatch, location.pathname, navigate, state.active, state.routines]);
}
