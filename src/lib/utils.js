import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge conditional + tailwind classes safely. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Stable-ish unique id. */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** YYYY-MM-DD key in local time. */
export function dayKey(d = new Date()) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HE_MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

export function formatDateHe(key) {
  const d = new Date(key + 'T00:00:00');
  return `יום ${HE_DAYS[d.getDay()]}, ${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
}

export function shortDateHe(key) {
  const d = new Date(key + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/* ── Weight units ──────────────────────────────────────────────────────
   Everything is STORED in kg (canonical). These helpers convert to/from the
   user's chosen display unit ('kg' | 'lb') so weights can be shown and
   entered in either unit. */
export const LB_PER_KG = 2.2046226218;

/** Short label for a unit, e.g. for "משקל (ק״ג)". */
export function unitLabel(unit) {
  return unit === 'lb' ? 'lb' : 'ק״ג';
}

/** kg → display unit (Number). Passes through empty/blank values untouched. */
export function toUnit(kg, unit) {
  if (kg === '' || kg == null) return kg;
  const n = Number(kg);
  if (Number.isNaN(n)) return '';
  return unit === 'lb' ? n * LB_PER_KG : n;
}

/** User input (in display unit) → kg for storage. Passes through blanks. */
export function toKg(value, unit) {
  if (value === '' || value == null) return value;
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return unit === 'lb' ? n / LB_PER_KG : n;
}

/** kg → display unit, rounded to 1 decimal for showing to the user. */
export function fmtWeight(kg, unit) {
  const n = toUnit(kg, unit);
  if (n === '' || n == null || Number.isNaN(Number(n))) return n;
  return Math.round(Number(n) * 10) / 10;
}

/** The opposite display unit. */
export function otherUnit(unit) {
  return unit === 'lb' ? 'kg' : 'lb';
}

/** kg → { kg, lb } both rounded to 1 decimal, for custom big/small layouts. */
export function weightParts(kg) {
  return { kg: fmtWeight(kg, 'kg'), lb: fmtWeight(kg, 'lb') };
}

/** kg → "135 lb / 61.2 ק״ג" — always both units, primary first. */
export function fmtWeightBoth(kg, primary = 'kg') {
  const n = Number(kg);
  if (kg === '' || kg == null || Number.isNaN(n)) return '—';
  const secondary = otherUnit(primary);
  return `${fmtWeight(kg, primary).toLocaleString()} ${unitLabel(primary)} / ${fmtWeight(kg, secondary).toLocaleString()} ${unitLabel(secondary)}`;
}

/** Total volume (kg) of a workout = Σ reps × weight over completed sets. */
export function workoutVolume(workout) {
  let v = 0;
  for (const ex of workout.exercises || []) {
    for (const s of ex.sets || []) {
      if (s.done && s.reps && s.weight) v += Number(s.reps) * Number(s.weight);
    }
  }
  return Math.round(v);
}

export function workoutSetCount(workout) {
  let n = 0;
  for (const ex of workout.exercises || []) {
    n += (ex.sets || []).filter((s) => s.done).length;
  }
  return n;
}

/** Estimated 1RM via Epley formula. */
export function epley1rm(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(Number(weight) * (1 + Number(reps) / 30));
}

export function fmtDuration(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* no-op */
  }
}
