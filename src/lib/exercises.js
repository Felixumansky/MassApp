/* Exercise library — muscle groups + the full exercise catalog.
   MUSCLES stays the app's 8 groups; EXERCISES now comes from the generated
   ExerciseDB catalog (regenerate via scripts/build-exercises.mjs). */
import { CATALOG, LEGACY_ALIASES } from './exercisesCatalog.js';

export { LEGACY_ALIASES };

export const MUSCLES = [
  { id: 'chest', label: 'חזה', color: '#fb7185' },
  { id: 'back', label: 'גב', color: '#38bdf8' },
  { id: 'shoulders', label: 'כתפיים', color: '#fbbf24' },
  { id: 'biceps', label: 'יד קדמית', color: '#a78bfa' },
  { id: 'triceps', label: 'יד אחורית', color: '#f472b6' },
  { id: 'legs', label: 'רגליים', color: '#c6f24e' },
  { id: 'glutes', label: 'ישבן', color: '#fb923c' },
  { id: 'core', label: 'בטן', color: '#2dd4bf' },
];

export const muscleById = (id) => MUSCLES.find((m) => m.id === id) || MUSCLES[0];

export const EXERCISES = CATALOG;

const _byId = new Map(EXERCISES.map((e) => [e.id, e]));

/** Look up a built-in exercise by id, resolving legacy ids (e.g. 'bench-press')
    to their new catalog entry via LEGACY_ALIASES so old routines keep working. */
export const exerciseById = (id) => _byId.get(id) || _byId.get(LEGACY_ALIASES[id]);

export function resolveExercise(id, customExercises = []) {
  return (customExercises || []).find((e) => e.id === id) || exerciseById(id);
}

/** Bilingual search match: Hebrew name (as-is) OR English name (case-insensitive). */
export function matchesExercise(ex, needle) {
  const n = String(needle || '').trim();
  if (!n) return true;
  if (ex.name && ex.name.includes(n)) return true;
  return !!ex.name_en && ex.name_en.toLowerCase().includes(n.toLowerCase());
}

export function routineExerciseId(entry) {
  return typeof entry === 'string' ? entry : entry?.exerciseId;
}

export function routineExerciseTargets(entry) {
  return typeof entry === 'string'
    ? { targetSets: 3, targetReps: '' }
    : {
        targetSets: Number(entry?.targetSets) || 3,
        targetReps: entry?.targetReps || '',
      };
}
