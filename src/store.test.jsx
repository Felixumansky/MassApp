import { describe, expect, it } from 'vitest';
import { reducer, seed } from './store.jsx';

describe('store reducer', () => {
  it('starts a routine with custom exercises and target sets', () => {
    const state = {
      ...seed(),
      customExercises: [{ id: 'cx-row', name: 'חתירה מותאמת', muscle: 'back', custom: true }],
    };

    const next = reducer(state, {
      type: 'startWorkout',
      routine: {
        id: 'r-custom',
        name: 'Custom',
        exercises: [{ exerciseId: 'cx-row', targetSets: 4, targetReps: '8' }],
      },
    });

    expect(next.active.name).toBe('Custom');
    expect(next.active.exercises[0].name).toBe('חתירה מותאמת');
    expect(next.active.exercises[0].sets).toHaveLength(4);
    expect(next.active.exercises[0].sets[0]).toMatchObject({ reps: '8', rpe: '', done: false });
  });

  it('keeps only completed sets when finishing a workout', () => {
    const started = reducer(seed(), { type: 'startWorkout' });
    const withExercise = {
      ...started,
      active: {
        ...started.active,
        exercises: [
          {
            uid: 'ex-1',
            exerciseId: 'bench-press',
            name: 'לחיצת חזה במוט',
            muscle: 'chest',
            sets: [
              { id: 's-1', reps: '5', weight: '100', rpe: '8', done: true },
              { id: 's-2', reps: '5', weight: '100', rpe: '', done: false },
            ],
          },
        ],
      },
    };

    const next = reducer(withExercise, { type: 'finishWorkout' });
    expect(next.active).toBeNull();
    expect(next.workouts).toHaveLength(1);
    expect(next.workouts[0].exercises[0].sets).toEqual([{ id: 's-1', reps: '5', weight: '100', rpe: '8', done: true }]);
  });

  it('resets app data to the starter seed', () => {
    const state = { ...seed(), workouts: [{ id: 'w-1' }], profile: { name: 'Dev', unit: 'lb', weeklyGoal: 5 } };
    const next = reducer(state, { type: 'resetAll' });
    expect(next.workouts).toEqual([]);
    expect(next.profile.unit).toBe('kg');
  });
});
