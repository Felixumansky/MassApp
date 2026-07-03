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

  it('prefills exercises and weights from the last workout of the same routine', () => {
    const routine = { id: 'r-push', name: 'Push', exercises: [{ exerciseId: 'bench-press', targetSets: 3, targetReps: '8' }] };
    const state = {
      ...seed(),
      workouts: [
        {
          id: 'w-prev',
          date: '2026-06-28',
          name: 'Push',
          routineId: 'r-push',
          durationSec: 3600,
          exercises: [
            {
              uid: 'ex-1',
              exerciseId: 'bench-press',
              name: 'לחיצת חזה במוט',
              muscle: 'chest',
              targetReps: '8',
              note: 'ספסל 4',
              sets: [
                { id: 's-1', reps: '8', weight: '80', rpe: '8', done: true },
                { id: 's-2', reps: '6', weight: '85', rpe: '9', done: true },
              ],
            },
          ],
        },
      ],
    };

    const next = reducer(state, { type: 'startWorkout', routine });

    expect(next.active.routineId).toBe('r-push');
    const ex = next.active.exercises[0];
    expect(ex.name).toBe('לחיצת חזה במוט');
    expect(ex.note).toBe('ספסל 4');
    expect(ex.sets).toHaveLength(2);
    expect(ex.sets[0]).toMatchObject({ reps: '8', weight: '80', rpe: '', done: false });
    expect(ex.sets[1]).toMatchObject({ reps: '6', weight: '85', rpe: '', done: false });
    expect(ex.sets[0].id).not.toBe('s-1');
  });

  it('prefills by name for old history without routineId', () => {
    const routine = { id: 'r-push', name: 'Push', exercises: ['bench-press'] };
    const state = {
      ...seed(),
      workouts: [
        {
          id: 'w-old',
          date: '2026-06-20',
          name: 'Push',
          durationSec: 3600,
          exercises: [
            {
              uid: 'ex-1',
              exerciseId: 'bench-press',
              name: 'לחיצת חזה במוט',
              muscle: 'chest',
              sets: [{ id: 's-1', reps: '10', weight: '70', rpe: '', done: true }],
            },
          ],
        },
      ],
    };

    const next = reducer(state, { type: 'startWorkout', routine });
    expect(next.active.exercises[0].sets[0]).toMatchObject({ reps: '10', weight: '70', done: false });
  });

  it('falls back to routine targets when there is no history of that type', () => {
    const routine = { id: 'r-new', name: 'Legs', exercises: [{ exerciseId: 'squat', targetSets: 4, targetReps: '5' }] };
    const next = reducer(seed(), { type: 'startWorkout', routine });
    expect(next.active.exercises[0].sets).toHaveLength(4);
    expect(next.active.exercises[0].sets[0]).toMatchObject({ reps: '5', weight: '', done: false });
  });

  it('stores routineId on finished workouts', () => {
    const routine = { id: 'r-push', name: 'Push', exercises: [] };
    const started = reducer(seed(), { type: 'startWorkout', routine });
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
            sets: [{ id: 's-1', reps: '5', weight: '100', rpe: '', done: true }],
          },
        ],
      },
    };
    const next = reducer(withExercise, { type: 'finishWorkout' });
    expect(next.workouts[0].routineId).toBe('r-push');
  });

  it('prefills sets from history when adding an exercise mid-workout', () => {
    const state = {
      ...seed(),
      workouts: [
        {
          id: 'w-prev',
          date: '2026-06-28',
          name: 'אימון חופשי',
          durationSec: 3600,
          exercises: [
            {
              uid: 'ex-1',
              exerciseId: 'bench-press',
              name: 'לחיצת חזה במוט',
              muscle: 'chest',
              sets: [
                { id: 's-1', reps: '8', weight: '80', rpe: '', done: true },
                { id: 's-2', reps: '8', weight: '80', rpe: '', done: true },
              ],
            },
          ],
        },
      ],
    };
    const started = reducer(state, { type: 'startWorkout' });
    const next = reducer(started, { type: 'addExercise', exerciseId: 'bench-press' });

    const ex = next.active.exercises[0];
    expect(ex.sets).toHaveLength(2);
    expect(ex.sets[0]).toMatchObject({ reps: '8', weight: '80', done: false });
  });

  it('adds an exercise with one empty set when it has no history', () => {
    const started = reducer(seed(), { type: 'startWorkout' });
    const next = reducer(started, { type: 'addExercise', exerciseId: 'bench-press' });
    expect(next.active.exercises[0].sets).toEqual([
      { id: expect.any(String), reps: '', weight: '', rpe: '', done: false },
    ]);
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

  it('does not discard an active workout when no completed sets can be saved', () => {
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
            sets: [{ id: 's-1', reps: '5', weight: '100', rpe: '', done: false }],
          },
        ],
      },
    };

    const next = reducer(withExercise, { type: 'finishWorkout' });

    expect(next.active).toBe(withExercise.active);
    expect(next.workouts).toHaveLength(0);
  });

  it('saves a checked set even when reps are still blank', () => {
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
            sets: [{ id: 's-1', reps: '', weight: '', rpe: '', done: true }],
          },
        ],
      },
    };

    const next = reducer(withExercise, { type: 'finishWorkout' });

    expect(next.active).toBeNull();
    expect(next.workouts).toHaveLength(1);
    expect(next.workouts[0].exercises[0].sets).toEqual([{ id: 's-1', reps: '', weight: '', rpe: '', done: true }]);
  });

  it('saves retroactive workouts with manual date and duration', () => {
    const started = reducer(seed(), {
      type: 'startWorkout',
      retroactive: true,
      date: '2026-06-20',
      durationSec: 45 * 60,
    });
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
            sets: [{ id: 's-1', reps: '8', weight: '80', rpe: '', done: true }],
          },
        ],
      },
    };

    const next = reducer(withExercise, { type: 'finishWorkout' });

    expect(next.workouts[0]).toMatchObject({
      date: '2026-06-20',
      durationSec: 2700,
      name: 'אימון חופשי',
    });
  });

  it('updates a saved workout and keeps workouts sorted by date', () => {
    const state = {
      ...seed(),
      workouts: [
        { id: 'w-1', date: '2026-06-20', name: 'Old', durationSec: 1200, exercises: [] },
        { id: 'w-2', date: '2026-06-25', name: 'Later', durationSec: 1800, exercises: [] },
      ],
    };

    const next = reducer(state, {
      type: 'updateWorkout',
      id: 'w-1',
      patch: { name: 'Updated', date: '2026-06-26', durationSec: 45 * 60 },
    });

    expect(next.workouts[0]).toMatchObject({
      id: 'w-1',
      name: 'Updated',
      date: '2026-06-26',
      durationSec: 2700,
    });
    expect(next.workouts.map((w) => w.id)).toEqual(['w-1', 'w-2']);
  });

  it('resets app data to the starter seed', () => {
    const state = { ...seed(), workouts: [{ id: 'w-1' }], profile: { name: 'Dev', unit: 'lb', weeklyGoal: 5 } };
    const next = reducer(state, { type: 'resetAll' });
    expect(next.workouts).toEqual([]);
    expect(next.profile.unit).toBe('kg');
    expect(next.profile.gymAutoStart.enabled).toBe(false);
  });

  it('keeps gym auto-start defaults when updating older profile data', () => {
    const state = { ...seed(), profile: { name: 'Dev', unit: 'kg', weeklyGoal: 4 } };
    const next = reducer(state, { type: 'profile', patch: { name: 'Dana' } });

    expect(next.profile.name).toBe('Dana');
    expect(next.profile.gymAutoStart).toMatchObject({
      enabled: false,
      radiusM: 120,
      routineId: 'free',
    });
  });
});
