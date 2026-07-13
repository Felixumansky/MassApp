import { describe, expect, it } from 'vitest';
import { mergeLocalStateIntoServer } from './cloudState.js';

describe('mergeLocalStateIntoServer', () => {
  it('keeps a local meal missing from the server response', () => {
    const local = {
      meals: [{ id: 'old', date: '2026-07-13' }, { id: 'new', date: '2026-07-13' }],
      deletedIds: [],
    };
    const server = { meals: [{ id: 'old', date: '2026-07-13' }] };

    const result = mergeLocalStateIntoServer(server, local);

    expect(result.meals.map((meal) => meal.id)).toEqual(['old', 'new']);
  });

  it('does not resurrect an item deleted locally during the pull', () => {
    const baseline = { meals: [{ id: 'deleted', date: '2026-07-13' }] };
    const local = { meals: [], deletedIds: ['deleted'] };
    const server = { meals: baseline.meals, deletedIds: [] };

    const result = mergeLocalStateIntoServer(server, local);

    expect(result.meals).toEqual([]);
    expect(result.deletedIds).toContain('deleted');
  });
});
