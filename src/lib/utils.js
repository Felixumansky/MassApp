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
