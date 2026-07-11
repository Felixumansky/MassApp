/* Pure, testable analytics selectors over the saved `workouts` array.
   Everything here is side-effect free so it can be unit-tested in isolation
   and reused across pages. Weights are the canonical kg stored on each set. */
import { epley1rm } from './utils.js';
import { LEGACY_ALIASES } from './exercises.js';

/* ── Feature 1: weekly working-set balance per muscle group ───────────────
   Counts each completed set toward its exercise's PRIMARY muscle only.
   ExerciseDB `secondaryMuscles` are free-text English strings that don't map
   cleanly onto the app's 8 groups, so v1 stays primary-only (reliable and it
   matches the `muscle` already stored on every logged exercise). */
export const HYPERTROPHY_MIN = 10;
export const HYPERTROPHY_MAX = 20;

const MUSCLE_IDS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core'];

/** A set "counts" if it was completed and has reps (weight optional → bodyweight). */
function isWorkingSet(s) {
  return !!s.done && Number(s.reps) > 0;
}

/** { chest: n, back: n, … } — completed sets per primary muscle within [startKey, endKey]. */
export function setsByMuscle(workouts, startKey, endKey) {
  const out = Object.fromEntries(MUSCLE_IDS.map((id) => [id, 0]));
  for (const w of workouts || []) {
    if (startKey && w.date < startKey) continue;
    if (endKey && w.date > endKey) continue;
    for (const ex of w.exercises || []) {
      const m = ex.muscle;
      if (!(m in out)) continue;
      for (const s of ex.sets || []) if (isWorkingSet(s)) out[m] += 1;
    }
  }
  return out;
}

/** Compare a weekly set count to the hypertrophy zone. `sets` may be an average. */
export function muscleSetStatus(sets) {
  if (sets < HYPERTROPHY_MIN) return 'low';
  if (sets > HYPERTROPHY_MAX) return 'high';
  return 'optimal';
}

/* ── id matching ──────────────────────────────────────────────────────────
   A logged set may carry a legacy id ('bench-press') while the catalog entry
   uses the new id ('edb-0025'). Match either the id itself or a legacy id that
   aliases to it. */
export function matchesLoggedId(loggedId, exerciseId, aliases = LEGACY_ALIASES) {
  if (!loggedId || !exerciseId) return false;
  return loggedId === exerciseId || aliases[loggedId] === exerciseId;
}

/* ── Feature 2: estimated-1RM progression + plateau detection ─────────────── */

/** [{ date, e1rm, weight, reps }] ascending by date — the best set per session. */
export function exerciseE1rmSeries(workouts, exerciseId, aliases = LEGACY_ALIASES) {
  const points = [];
  for (const w of workouts || []) {
    let best = null;
    for (const ex of w.exercises || []) {
      if (!matchesLoggedId(ex.exerciseId, exerciseId, aliases)) continue;
      for (const s of ex.sets || []) {
        if (!s.done || !s.weight || !s.reps) continue;
        const e1rm = epley1rm(s.weight, s.reps);
        if (!best || e1rm > best.e1rm) best = { date: w.date, e1rm, weight: Number(s.weight), reps: Number(s.reps) };
      }
    }
    if (best) points.push(best);
  }
  return points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** True when the last `minSessions` sessions show no e1RM gain ≥ minGainKg over the prior best. */
export function detectPlateau(series, { minSessions = 3, minGainKg = 1 } = {}) {
  if (!series || series.length < minSessions) return false;
  const recent = series.slice(-minSessions);
  const earlier = series.slice(0, -minSessions);
  const priorBest = earlier.length
    ? Math.max(...earlier.map((p) => p.e1rm))
    : recent[0].e1rm;
  const recentBest = Math.max(...recent.map((p) => p.e1rm));
  return recentBest - priorBest < minGainKg;
}

/* ── Feature 3: progressive-overload suggestion (double progression) ──────── */

/** The exercise object from the most recent workout that contained it, or null. */
export function lastSessionExercise(workouts, exerciseId, aliases = LEGACY_ALIASES) {
  for (const w of workouts || []) {
    for (const ex of w.exercises || []) {
      if (matchesLoggedId(ex.exerciseId, exerciseId, aliases)) return ex;
    }
  }
  return null;
}

/** "8-12" → {lo,hi}; "10" → {lo,hi=10}; blank/garbage → default 8–12. */
export function parseRepRange(targetReps) {
  const str = String(targetReps ?? '').trim();
  const range = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
  }
  const single = str.match(/\d+/);
  if (single) return { lo: Number(single[0]), hi: Number(single[0]) };
  return { lo: 8, hi: 12 };
}

/** Double progression from last session's top set → { weight(kg), reps }, or null. */
export function suggestNextSet(lastExercise, targetReps, stepKg = 2.5) {
  const sets = (lastExercise?.sets || []).filter((s) => Number(s.reps) > 0);
  if (!sets.length) return null;
  const top = sets.reduce((a, b) => (epley1rm(b.weight, b.reps) > epley1rm(a.weight, a.reps) ? b : a));
  const weight = Number(top.weight) || 0;
  const reps = Number(top.reps) || 0;
  const { lo, hi } = parseRepRange(targetReps);
  if (reps < hi) return { weight, reps: reps + 1 };
  // reached the top of the rep range → add load (if weighted) and reset reps
  return weight > 0 ? { weight: weight + stepKg, reps: lo } : { weight, reps: reps + 1 };
}
