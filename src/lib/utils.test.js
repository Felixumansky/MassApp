import { describe, expect, it } from 'vitest';
import {
  epley1rm,
  fmtWeight,
  toKg,
  toUnit,
  workoutVolume,
  uniqueRoutineName,
  routineFromWorkout,
} from './utils.js';

describe('weight helpers', () => {
  it('converts kg and lb without changing blank inputs', () => {
    expect(toUnit(100, 'kg')).toBe(100);
    expect(Math.round(toUnit(100, 'lb'))).toBe(220);
    expect(Math.round(toKg(220.46226218, 'lb'))).toBe(100);
    expect(toKg('', 'lb')).toBe('');
  });

  it('formats display weights to one decimal', () => {
    expect(fmtWeight(100, 'kg')).toBe(100);
    expect(fmtWeight(100, 'lb')).toBe(220.5);
  });
});

describe('workout math', () => {
  it('counts only completed sets with reps and weight in volume', () => {
    expect(
      workoutVolume({
        exercises: [
          {
            sets: [
              { done: true, reps: '10', weight: '100' },
              { done: false, reps: '10', weight: '100' },
              { done: true, reps: '', weight: '100' },
            ],
          },
        ],
      })
    ).toBe(1000);
  });

  it('calculates estimated 1RM with Epley', () => {
    expect(epley1rm(100, 6)).toBe(120);
  });
});

describe('uniqueRoutineName', () => {
  it('returns the name untouched when free', () => {
    expect(uniqueRoutineName('Push', [{ name: 'Pull' }])).toBe('Push');
  });

  it('appends an increasing suffix on collisions (case-insensitive)', () => {
    const routines = [{ name: 'Push' }, { name: 'push (2)' }];
    expect(uniqueRoutineName('push', routines)).toBe('push (3)');
  });

  it('falls back to a default when the name is blank', () => {
    expect(uniqueRoutineName('   ', [])).toBe('תוכנית');
  });
});

describe('routineFromWorkout', () => {
  it('converts exercises using set count and the most common reps', () => {
    const routine = routineFromWorkout(
      {
        name: 'Leg day',
        exercises: [
          {
            exerciseId: 'squat',
            sets: [
              { reps: '5', weight: '100' },
              { reps: '5', weight: '100' },
              { reps: '8', weight: '80' },
            ],
          },
        ],
      },
      'רגליים'
    );
    expect(routine.name).toBe('רגליים');
    expect(routine.id).toBeTruthy();
    expect(routine.exercises).toEqual([
      {
        exerciseId: 'squat',
        targetSets: 3,
        targetReps: '5',
        sets: [
          { reps: '5', weight: '100' },
          { reps: '5', weight: '100' },
          { reps: '8', weight: '80' },
        ],
      },
    ]);
  });

  it('falls back to targetSets/targetReps when there are no sets', () => {
    const routine = routineFromWorkout(
      { exercises: [{ exerciseId: 'bench', sets: [], targetSets: 4, targetReps: 10 }] },
      'x'
    );
    expect(routine.exercises[0]).toMatchObject({ targetSets: 4, targetReps: '10' });
  });

  it('preserves the session exercise details needed for an exact program copy', () => {
    const routine = routineFromWorkout(
      {
        exercises: [{
          exerciseId: 'edb-standing-press',
          name: 'לחיצה מלמטה בעמידה',
          muscle: 'shoulders',
          note: 'אחיזה הפוכה',
          photo: 'data:image/jpeg;base64,abc',
          sets: [{ reps: '10', weight: '20', rpe: '8', done: true }],
        }],
      },
      'האימון האחרון'
    );

    expect(routine.exercises[0]).toEqual({
      exerciseId: 'edb-standing-press',
      targetSets: 1,
      targetReps: '10',
      name: 'לחיצה מלמטה בעמידה',
      muscle: 'shoulders',
      note: 'אחיזה הפוכה',
      photo: 'data:image/jpeg;base64,abc',
      sets: [{ reps: '10', weight: '20' }],
    });
  });
});
