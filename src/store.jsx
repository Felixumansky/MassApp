import { createContext, useContext, useMemo, useReducer } from 'react';
import { uid, dayKey } from './lib/utils.js';
import { resolveExercise, routineExerciseId, routineExerciseTargets } from './lib/exercises.js';

/** Resolve an exercise id from the built-in library OR the user's custom ones. */
function findEx(state, id) {
  return resolveExercise(id, state.customExercises);
}

/** Most recent saved workout of the same type. Matches by routineId (new data)
    and falls back to name equality (old history has no routineId). */
function lastWorkoutOfType(workouts, routine) {
  if (!routine) return null;
  return (
    workouts.find((w) => w.routineId === routine.id) ||
    workouts.find((w) => !w.routineId && w.name === routine.name) ||
    null
  );
}

/** Copy a saved workout's exercises into fresh active exercises: fresh ids,
    done:false, keep weight+reps+note. RPE is reset — it's a per-session
    outcome, and finishWorkout keeps whatever is in a checked set. */
function prefillExercises(prev) {
  return prev.exercises.map((e) => ({
    uid: uid(),
    exerciseId: e.exerciseId,
    name: e.name,
    muscle: e.muscle,
    targetSets: e.sets.length || e.targetSets || 1,
    targetReps: e.targetReps ?? '',
    note: e.note || '',
    ...(e.photo ? { photo: e.photo } : null),
    sets: e.sets.map((s) => ({ id: uid(), reps: s.reps, weight: s.weight, rpe: '', done: false })),
  }));
}

const STARTER = {
  id: 'r-ppl-push',
  name: 'Push — דחיפה',
  exercises: ['bench-press', 'ohp', 'incline-db-press', 'lateral-raise', 'triceps-pushdown'],
};

export const DEFAULT_GYM_AUTO_START = {
  enabled: false,
  latitude: '',
  longitude: '',
  radiusM: 120,
  routineId: 'free',
};

function profileDefaults() {
  return {
    name: '',
    unit: 'lb',
    unitMigratedLb: true,
    // Per-exercise entry unit ('kg' | 'lb') keyed by exerciseId — machines
    // differ, so each exercise remembers the unit it was last entered in.
    exerciseUnits: {},
    weeklyGoal: 4,
    gymAutoStart: DEFAULT_GYM_AUTO_START,
  };
}

function normalizeProfile(profile = {}) {
  const p = {
    ...profileDefaults(),
    ...profile,
    gymAutoStart: {
      ...DEFAULT_GYM_AUTO_START,
      ...(profile.gymAutoStart || {}),
    },
    exerciseUnits: { ...(profile.exerciseUnits || {}) },
  };
  // One-time switch of pre-existing profiles to lb entry (gym plates are in
  // pounds); afterwards the user's own toggle choice is respected.
  if (!p.unitMigratedLb) {
    p.unit = 'lb';
    p.unitMigratedLb = true;
  }
  return p;
}

export function seed() {
  return {
    profile: profileDefaults(),
    routines: [
      STARTER,
      { id: 'r-ppl-pull', name: 'Pull — משיכה', exercises: ['deadlift', 'pullup', 'seated-row', 'barbell-curl', 'face-pull'] },
      { id: 'r-legs', name: 'Legs — רגליים', exercises: ['squat', 'rdl', 'leg-press', 'leg-curl', 'calf-raise'] },
    ],
    workouts: [],
    bodyWeights: [],
    customExercises: [],
    // Persistent user-uploaded image per exercise, keyed by exerciseId
    // ({ [exerciseId]: <jpeg dataURL> }). Shown in the library + detail sheet.
    exerciseImages: {},
    deletedIds: [],
    active: null,
    // Bottom-docked rest timer. `open` is session-only UI state (reset on load);
    // `seconds` persists so the user's last chosen duration sticks.
    restTimer: { open: false, seconds: 90 },
  };
}

/** Remember deleted ids so cloud merge won't resurrect them from the server. */
function tombstone(state, ...ids) {
  return [...(state.deletedIds || []), ...ids].slice(-1000);
}

export function reducer(state, action) {
  switch (action.type) {
    case 'resetAll':
      return seed();

    case 'profile':
      return { ...state, profile: normalizeProfile({ ...state.profile, ...action.patch }) };

    case 'replaceAll':
      // Replace synced slices from the cloud; keep any in-progress workout local.
      return {
        ...state,
        profile:
          action.data.profile && Object.keys(action.data.profile).length
            ? normalizeProfile(action.data.profile)
            : state.profile,
        workouts: action.data.workouts || [],
        routines: action.data.routines || [],
        bodyWeights: action.data.bodyWeights || [],
        customExercises: action.data.customExercises || [],
        exerciseImages: action.data.exerciseImages || state.exerciseImages || {},
        deletedIds: action.data.deletedIds || state.deletedIds || [],
      };

    case 'startWorkout': {
      const fromRoutine = action.routine
        ? action.routine.exercises.map((entry) => {
            const id = routineExerciseId(entry);
            const targets = routineExerciseTargets(entry);
            const ex = findEx(state, id);
            return {
              uid: uid(),
              exerciseId: id,
              name: ex?.name ?? id,
              muscle: ex?.muscle ?? 'chest',
              targetSets: targets.targetSets,
              targetReps: targets.targetReps,
              note: '',
              sets: Array.from({ length: targets.targetSets }, () => ({
                id: uid(),
                reps: targets.targetReps,
                weight: '',
                rpe: '',
                done: false,
              })),
            };
          })
        : [];
      const prev = lastWorkoutOfType(state.workouts, action.routine);
      return {
        ...state,
        active: {
          id: uid(),
          date: action.date ?? dayKey(),
          name: action.routine?.name ?? 'אימון חופשי',
          routineId: action.routine?.id ?? null,
          startedAt: Date.now(),
          retroactive: !!action.retroactive,
          durationSec: action.retroactive ? Math.max(60, Math.round(Number(action.durationSec) || 3600)) : undefined,
          exercises: prev ? prefillExercises(prev) : fromRoutine,
        },
      };
    }

    case 'updateActiveMeta':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          ...(action.name != null ? { name: action.name } : null),
          ...(action.date ? { date: action.date } : null),
          ...(action.durationSec != null
            ? { durationSec: Math.max(60, Math.round(Number(action.durationSec) || 60)) }
            : null),
        },
      };

    case 'addExercise': {
      if (!state.active) return state;
      const ex = findEx(state, action.exerciseId);
      // Prefill sets from the last time this exercise was performed (workouts are
      // newest-first). Compare canonical ids so legacy ids ('bench-press') in old
      // workouts match the catalog id the picker hands out.
      const canonicalId = (id) => findEx(state, id)?.id ?? id;
      const wantedId = canonicalId(action.exerciseId);
      let prevEx = null;
      for (const w of state.workouts) {
        prevEx = w.exercises.find((e) => canonicalId(e.exerciseId) === wantedId);
        if (prevEx) break;
      }
      const sets = prevEx?.sets?.length
        ? prevEx.sets.map((s) => ({ id: uid(), reps: s.reps, weight: s.weight, rpe: '', done: false }))
        : [{ id: uid(), reps: '', weight: '', rpe: '', done: false }];
      return {
        ...state,
        active: {
          ...state.active,
          exercises: [
            ...state.active.exercises,
            {
              uid: uid(),
              exerciseId: action.exerciseId,
              name: ex?.name ?? action.exerciseId,
              muscle: ex?.muscle ?? 'chest',
              targetSets: sets.length,
              targetReps: prevEx?.targetReps ?? '',
              note: prevEx?.note ?? '',
              ...(prevEx?.photo ? { photo: prevEx.photo } : null),
              sets,
            },
          ],
        },
      };
    }

    case 'removeExercise':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.filter((e) => e.uid !== action.uid),
        },
      };

    case 'addSet':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid
              ? {
                  ...e,
                  sets: [
                    ...e.sets,
                    {
                      id: uid(),
                      reps: e.targetReps || '',
                      weight: e.sets.at(-1)?.weight ?? '',
                      rpe: '',
                      done: false,
                    },
                  ],
                }
              : e
          ),
        },
      };

    case 'duplicateSet':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid && e.sets.some((s) => s.id === action.setId)
              ? {
                  ...e,
                  sets: [
                    ...e.sets,
                    {
                      ...e.sets.find((s) => s.id === action.setId),
                      id: uid(),
                      done: false,
                    },
                  ],
                }
              : e
          ),
        },
      };

    case 'updateSet':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid
              ? { ...e, sets: e.sets.map((s) => (s.id === action.setId ? { ...s, ...action.patch } : s)) }
              : e
          ),
        },
      };

    case 'removeSet':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid ? { ...e, sets: e.sets.filter((s) => s.id !== action.setId) } : e
          ),
        },
      };

    case 'updateExerciseNote':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid ? { ...e, note: action.note } : e
          ),
        },
      };

    case 'updateExerciseName':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid ? { ...e, name: action.name } : e
          ),
        },
      };

    case 'editWorkout': {
      // Reopen a saved workout for full editing. The original stays in history
      // until finishWorkout replaces it (same id), so discarding loses nothing.
      if (state.active) return state;
      const w = state.workouts.find((x) => x.id === action.id);
      if (!w) return state;
      return {
        ...state,
        active: {
          id: w.id,
          date: w.date,
          name: w.name,
          routineId: w.routineId ?? null,
          startedAt: Date.now(),
          retroactive: true,
          durationSec: Math.max(60, Math.round(Number(w.durationSec) || 60)),
          exercises: (w.exercises || []).map((e) => ({
            ...e,
            uid: e.uid || uid(),
            sets: (e.sets || []).map((s) => ({ ...s, id: s.id || uid() })),
          })),
        },
      };
    }

    case 'updateExercisePhoto':
      if (!state.active) return state;
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid ? { ...e, photo: action.photo || undefined } : e
          ),
        },
      };

    case 'finishWorkout': {
      if (!state.active) return state;
      const durationSec = state.active.retroactive
        ? Math.max(60, Math.round(Number(state.active.durationSec) || 60))
        : Math.round((Date.now() - state.active.startedAt) / 1000);
      const finished = {
        id: state.active.id,
        date: state.active.date,
        name: state.active.name,
        routineId: state.active.routineId ?? null,
        durationSec,
        exercises: state.active.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
          .filter((e) => e.sets.length > 0),
      };
      if (finished.exercises.length === 0) return state;
      return {
        ...state,
        active: null,
        restTimer: { ...(state.restTimer || { seconds: 90 }), open: false },
        workouts: [finished, ...state.workouts.filter((w) => w.id !== finished.id)].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
      };
    }

    case 'openRestTimer':
      return {
        ...state,
        restTimer: { open: true, seconds: action.seconds ?? state.restTimer?.seconds ?? 90 },
      };

    case 'setRestSeconds':
      return { ...state, restTimer: { open: true, seconds: action.seconds } };

    case 'closeRestTimer':
      return { ...state, restTimer: { ...(state.restTimer || { seconds: 90 }), open: false } };

    case 'discardWorkout':
      return { ...state, active: null, restTimer: { ...(state.restTimer || { seconds: 90 }), open: false } };

    case 'deleteWorkout':
      return {
        ...state,
        workouts: state.workouts.filter((w) => w.id !== action.id),
        deletedIds: tombstone(state, action.id),
      };

    case 'updateWorkout': {
      const next = state.workouts
        .map((w) =>
          w.id === action.id
            ? {
                ...w,
                ...action.patch,
                durationSec:
                  action.patch.durationSec != null
                    ? Math.max(60, Math.round(Number(action.patch.durationSec) || 60))
                    : w.durationSec,
              }
            : w
        )
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      return { ...state, workouts: next };
    }

    case 'saveRoutine': {
      const exists = state.routines.some((r) => r.id === action.routine.id);
      return {
        ...state,
        routines: exists
          ? state.routines.map((r) => (r.id === action.routine.id ? action.routine : r))
          : [...state.routines, action.routine],
      };
    }

    case 'deleteRoutine':
      return {
        ...state,
        routines: state.routines.filter((r) => r.id !== action.id),
        deletedIds: tombstone(state, action.id),
      };

    case 'addBodyWeight': {
      const date = action.date ?? dayKey();
      // Keep the existing id when re-weighing the same day, so the cloud merge
      // (which unions by id) updates the entry instead of duplicating it.
      const existing = state.bodyWeights.find((b) => b.date === date);
      const rest = state.bodyWeights.filter((b) => b.date !== date);
      return {
        ...state,
        bodyWeights: [...rest, { id: existing?.id ?? uid(), date, weight: Number(action.weight) }].sort((a, b) =>
          a.date < b.date ? -1 : 1
        ),
      };
    }

    case 'deleteBodyWeight':
      return {
        ...state,
        bodyWeights: state.bodyWeights.filter((b) => b.id !== action.id),
        deletedIds: tombstone(state, action.id),
      };

    case 'updateBodyWeight': {
      const entry = state.bodyWeights.find((b) => b.id === action.id);
      if (!entry) return state;
      const newDate = action.date ?? entry.date;
      const newWeight = action.weight != null ? Number(action.weight) : entry.weight;
      // If the date changed, remove any existing entry on the target date
      // (the updated entry takes its place).
      const rest = state.bodyWeights.filter(
        (b) => b.id !== action.id && b.date !== newDate
      );
      return {
        ...state,
        bodyWeights: [...rest, { id: entry.id, date: newDate, weight: newWeight }].sort(
          (a, b) => (a.date < b.date ? -1 : 1)
        ),
      };
    }

    case 'addCustomExercise': {
      const id = 'cx-' + uid();
      const ex = { id, name: action.name.trim(), muscle: action.muscle, custom: true };
      return { ...state, customExercises: [...(state.customExercises || []), ex] };
    }

    case 'deleteCustomExercise':
      return {
        ...state,
        customExercises: (state.customExercises || []).filter((e) => e.id !== action.id),
        exerciseImages: (() => {
          const next = { ...(state.exerciseImages || {}) };
          delete next[action.id];
          return next;
        })(),
        deletedIds: tombstone(state, action.id),
      };

    case 'setExerciseImage':
      if (!action.id || !action.dataUrl) return state;
      return {
        ...state,
        exerciseImages: { ...(state.exerciseImages || {}), [action.id]: action.dataUrl },
      };

    case 'removeExerciseImage': {
      const next = { ...(state.exerciseImages || {}) };
      delete next[action.id];
      return { ...state, exerciseImages: next };
    }

    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  // In-memory only — the DB is the single source of truth. Nothing about the
  // user's data is cached in localStorage; the cloud layer pulls the state on
  // login and pushes every change straight to the server.
  const [state, dispatch] = useReducer(reducer, undefined, seed);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
