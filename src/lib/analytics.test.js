import { describe, expect, it } from 'vitest';
import {
  setsByMuscle,
  muscleSetStatus,
  matchesLoggedId,
  exerciseE1rmSeries,
  detectPlateau,
  lastSessionExercise,
  parseRepRange,
  suggestNextSet,
} from './analytics.js';

const wk = (date, exercises) => ({ id: date, date, exercises });
const set = (reps, weight, extra = {}) => ({ done: true, reps, weight, ...extra });

describe('setsByMuscle', () => {
  const workouts = [
    wk('2026-06-10', [
      { exerciseId: 'a', muscle: 'chest', sets: [set('10', '60'), set('8', '60'), { done: false, reps: '8', weight: '60' }] },
      { exerciseId: 'b', muscle: 'triceps', sets: [set('12', '20'), set('', '20')] },
    ]),
    wk('2026-06-01', [{ exerciseId: 'a', muscle: 'chest', sets: [set('10', '60')] }]),
  ];

  it('counts only completed sets with reps, per primary muscle, in range', () => {
    const res = setsByMuscle(workouts, '2026-06-05', '2026-06-15');
    expect(res.chest).toBe(2); // two done sets; the not-done one is excluded
    expect(res.triceps).toBe(1); // blank-reps set excluded
    expect(res.back).toBe(0);
  });

  it('excludes workouts outside the date range', () => {
    const res = setsByMuscle(workouts, '2026-06-05', '2026-06-15');
    expect(res.chest).toBe(2); // the 2026-06-01 workout is out of range
  });
});

describe('muscleSetStatus', () => {
  it('classifies against the 10–20 hypertrophy zone', () => {
    expect(muscleSetStatus(4)).toBe('low');
    expect(muscleSetStatus(12)).toBe('optimal');
    expect(muscleSetStatus(24)).toBe('high');
  });
});

describe('matchesLoggedId', () => {
  it('matches direct ids and legacy aliases', () => {
    const aliases = { 'bench-press': 'edb-0025' };
    expect(matchesLoggedId('edb-0025', 'edb-0025', aliases)).toBe(true);
    expect(matchesLoggedId('bench-press', 'edb-0025', aliases)).toBe(true);
    expect(matchesLoggedId('other', 'edb-0025', aliases)).toBe(false);
  });
});

describe('exerciseE1rmSeries + detectPlateau', () => {
  const workouts = [
    wk('2026-06-20', [{ exerciseId: 'sq', muscle: 'legs', sets: [set('5', '100'), set('5', '102')] }]),
    wk('2026-06-13', [{ exerciseId: 'sq', muscle: 'legs', sets: [set('5', '100')] }]),
    wk('2026-06-06', [{ exerciseId: 'sq', muscle: 'legs', sets: [set('5', '99')] }]),
  ];

  it('returns one ascending point per session using the best set', () => {
    const s = exerciseE1rmSeries(workouts, 'sq', {});
    expect(s.map((p) => p.date)).toEqual(['2026-06-06', '2026-06-13', '2026-06-20']);
    expect(s.at(-1).weight).toBe(102); // best set of the last session
    expect(s[0].e1rm).toBeLessThan(s.at(-1).e1rm);
  });

  it('flags a plateau when recent sessions do not improve', () => {
    const flat = [
      { date: '1', e1rm: 100 },
      { date: '2', e1rm: 100 },
      { date: '3', e1rm: 100 },
    ];
    expect(detectPlateau(flat, { minSessions: 3, minGainKg: 1 })).toBe(true);
    const rising = [
      { date: '1', e1rm: 100 },
      { date: '2', e1rm: 105 },
      { date: '3', e1rm: 110 },
    ];
    expect(detectPlateau(rising, { minSessions: 3, minGainKg: 1 })).toBe(false);
  });

  it('needs enough sessions before it can plateau', () => {
    expect(detectPlateau([{ date: '1', e1rm: 100 }], { minSessions: 3 })).toBe(false);
  });
});

describe('lastSessionExercise', () => {
  it('returns the exercise from the most recent (first) matching workout', () => {
    const workouts = [
      wk('2026-06-20', [{ exerciseId: 'sq', muscle: 'legs', sets: [set('5', '110')] }]),
      wk('2026-06-13', [{ exerciseId: 'sq', muscle: 'legs', sets: [set('5', '100')] }]),
    ];
    expect(lastSessionExercise(workouts, 'sq', {}).sets[0].weight).toBe('110');
    expect(lastSessionExercise(workouts, 'missing', {})).toBe(null);
  });
});

describe('parseRepRange', () => {
  it('parses ranges, single numbers, and falls back to 8–12', () => {
    expect(parseRepRange('8-12')).toEqual({ lo: 8, hi: 12 });
    expect(parseRepRange('10')).toEqual({ lo: 10, hi: 10 });
    expect(parseRepRange('')).toEqual({ lo: 8, hi: 12 });
    expect(parseRepRange('12-8')).toEqual({ lo: 8, hi: 12 });
  });
});

describe('suggestNextSet', () => {
  it('adds a rep while below the top of the range', () => {
    const ex = { sets: [set('8', '60'), set('8', '60')] };
    expect(suggestNextSet(ex, '8-12')).toEqual({ weight: 60, reps: 9 });
  });

  it('adds load and resets reps once the top of the range is reached', () => {
    const ex = { sets: [set('12', '60')] };
    expect(suggestNextSet(ex, '8-12', 2.5)).toEqual({ weight: 62.5, reps: 8 });
  });

  it('progresses reps only for bodyweight sets', () => {
    const ex = { sets: [set('12', '')] };
    expect(suggestNextSet(ex, '8-12')).toEqual({ weight: 0, reps: 13 });
  });

  it('returns null with no history', () => {
    expect(suggestNextSet(null, '8-12')).toBe(null);
    expect(suggestNextSet({ sets: [] }, '8-12')).toBe(null);
  });
});
