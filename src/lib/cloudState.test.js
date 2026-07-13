import { describe, expect, it } from 'vitest';
import { mergeLocalAddsIntoServer } from './cloudState.js';

describe('mergeLocalAddsIntoServer', () => {
  it('keeps a meal added while the initial pull is in flight', () => {
    const baseline = { meals: [{ id: 'old', date: '2026-07-13' }] };
    const local = {
      meals: [...baseline.meals, { id: 'new', date: '2026-07-13' }],
      deletedIds: [],
    };
    const server = { meals: baseline.meals };

    const result = mergeLocalAddsIntoServer(server, local, baseline);

    expect(result.meals.map((meal) => meal.id)).toEqual(['old', 'new']);
  });

  it('does not resurrect an item deleted locally during the pull', () => {
    const baseline = { meals: [{ id: 'deleted', date: '2026-07-13' }] };
    const local = { meals: [], deletedIds: ['deleted'] };
    const server = { meals: baseline.meals, deletedIds: [] };

    const result = mergeLocalAddsIntoServer(server, local, baseline);

    expect(result.meals).toEqual([]);
    expect(result.deletedIds).toContain('deleted');
  });
});
