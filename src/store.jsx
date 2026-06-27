import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { uid, dayKey } from './lib/utils.js';
import { exerciseById } from './lib/exercises.js';

const KEY = 'liftlog.v2';

/** Resolve an exercise id from the built-in library OR the user's custom ones. */
function findEx(state, id) {
  return (state.customExercises || []).find((e) => e.id === id) || exerciseById(id);
}

const STARTER = {
  id: 'r-ppl-push',
  name: 'Push — דחיפה',
  exercises: ['bench-press', 'ohp', 'incline-db-press', 'lateral-raise', 'triceps-pushdown'],
};

function seed() {
  return {
    profile: { name: '', unit: 'kg', weeklyGoal: 4 },
    routines: [
      STARTER,
      { id: 'r-ppl-pull', name: 'Pull — משיכה', exercises: ['deadlift', 'pullup', 'seated-row', 'barbell-curl', 'face-pull'] },
      { id: 'r-legs', name: 'Legs — רגליים', exercises: ['squat', 'rdl', 'leg-press', 'leg-curl', 'calf-raise'] },
    ],
    workouts: [],
    bodyWeights: [],
    customExercises: [],
    active: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return seed();
}

function reducer(state, action) {
  switch (action.type) {
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'replaceAll':
      // Replace synced slices from the cloud; keep any in-progress workout local.
      return {
        ...state,
        profile: action.data.profile && Object.keys(action.data.profile).length ? action.data.profile : state.profile,
        workouts: action.data.workouts || [],
        routines: action.data.routines || [],
        bodyWeights: action.data.bodyWeights || [],
        customExercises: action.data.customExercises || [],
      };

    case 'startWorkout': {
      const fromRoutine = action.routine
        ? action.routine.exercises.map((id) => {
            const ex = findEx(state, id);
            return {
              uid: uid(),
              exerciseId: id,
              name: ex?.name ?? id,
              muscle: ex?.muscle ?? 'chest',
              sets: [{ id: uid(), reps: '', weight: '', done: false }],
            };
          })
        : [];
      return {
        ...state,
        active: {
          id: uid(),
          date: dayKey(),
          name: action.routine?.name ?? 'אימון חופשי',
          startedAt: Date.now(),
          exercises: fromRoutine,
        },
      };
    }

    case 'addExercise': {
      if (!state.active) return state;
      const ex = findEx(state, action.exerciseId);
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
              sets: [{ id: uid(), reps: '', weight: '', done: false }],
            },
          ],
        },
      };
    }

    case 'removeExercise':
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.filter((e) => e.uid !== action.uid),
        },
      };

    case 'addSet':
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid
              ? { ...e, sets: [...e.sets, { id: uid(), reps: '', weight: e.sets.at(-1)?.weight ?? '', done: false }] }
              : e
          ),
        },
      };

    case 'updateSet':
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
      return {
        ...state,
        active: {
          ...state.active,
          exercises: state.active.exercises.map((e) =>
            e.uid === action.uid ? { ...e, sets: e.sets.filter((s) => s.id !== action.setId) } : e
          ),
        },
      };

    case 'finishWorkout': {
      if (!state.active) return state;
      const durationSec = Math.round((Date.now() - state.active.startedAt) / 1000);
      const finished = {
        id: state.active.id,
        date: state.active.date,
        name: state.active.name,
        durationSec,
        exercises: state.active.exercises
          .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps) }))
          .filter((e) => e.sets.length > 0),
      };
      if (finished.exercises.length === 0) return { ...state, active: null };
      return { ...state, active: null, workouts: [finished, ...state.workouts] };
    }

    case 'discardWorkout':
      return { ...state, active: null };

    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };

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
      return { ...state, routines: state.routines.filter((r) => r.id !== action.id) };

    case 'addBodyWeight': {
      const date = action.date ?? dayKey();
      const rest = state.bodyWeights.filter((b) => b.date !== date);
      return {
        ...state,
        bodyWeights: [...rest, { id: uid(), date, weight: Number(action.weight) }].sort((a, b) =>
          a.date < b.date ? -1 : 1
        ),
      };
    }

    case 'deleteBodyWeight':
      return { ...state, bodyWeights: state.bodyWeights.filter((b) => b.id !== action.id) };

    case 'addCustomExercise': {
      const id = 'cx-' + uid();
      const ex = { id, name: action.name.trim(), muscle: action.muscle, custom: true };
      return { ...state, customExercises: [...(state.customExercises || []), ex] };
    }

    case 'deleteCustomExercise':
      return {
        ...state,
        customExercises: (state.customExercises || []).filter((e) => e.id !== action.id),
      };

    default:
      return state;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode */
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
