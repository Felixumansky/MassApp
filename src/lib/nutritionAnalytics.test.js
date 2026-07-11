import { describe, it, expect } from 'vitest';
import {
  mealTotals,
  dayTotals,
  mealsByType,
  caloriesByDay,
  macroDistribution,
  mealTypeDistribution,
  goalAdherence,
  encouragementMessage,
} from './nutritionAnalytics.js';

const item = (calories, protein = 0, carbs = 0, fat = 0) => ({ name: 'x', amount: 100, unit: 'גרם', calories, protein, carbs, fat });

const meal = (date, mealType, items) => ({ id: date + mealType, date, mealType, items, source: 'text', createdAt: 1 });

describe('mealTotals', () => {
  it('sums item values and rounds', () => {
    const t = mealTotals(meal('2026-07-11', 'lunch', [item(200, 20.05, 10, 5), item(100, 5, 15.04, 2)]));
    expect(t).toEqual({ calories: 300, protein: 25.1, carbs: 25, fat: 7 });
  });

  it('handles a meal without items', () => {
    expect(mealTotals({ items: [] })).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('dayTotals', () => {
  const meals = [
    meal('2026-07-11', 'breakfast', [item(400, 30, 40, 10)]),
    meal('2026-07-11', 'dinner', [item(600, 40, 50, 20)]),
    meal('2026-07-10', 'lunch', [item(999, 99, 99, 99)]), // יום אחר — לא נספר
  ];
  const water = [
    { id: 'w1', date: '2026-07-11', amountMl: 250 },
    { id: 'w2', date: '2026-07-11', amountMl: 500 },
    { id: 'w3', date: '2026-07-10', amountMl: 750 },
  ];

  it('sums only the requested day, incl. water', () => {
    expect(dayTotals(meals, water, '2026-07-11')).toEqual({
      calories: 1000, protein: 70, carbs: 90, fat: 30, waterMl: 750,
    });
  });

  it('empty day returns zeros', () => {
    expect(dayTotals(meals, water, '2026-01-01')).toEqual({
      calories: 0, protein: 0, carbs: 0, fat: 0, waterMl: 0,
    });
  });
});

describe('mealsByType', () => {
  it('groups by type and defaults unknown types to snack', () => {
    const meals = [
      meal('2026-07-11', 'breakfast', [item(100)]),
      meal('2026-07-11', 'weird-type', [item(50)]),
    ];
    const g = mealsByType(meals, '2026-07-11');
    expect(g.breakfast).toHaveLength(1);
    expect(g.snack).toHaveLength(1);
    expect(g.lunch).toHaveLength(0);
  });
});

describe('caloriesByDay', () => {
  it('returns a contiguous ascending series with zero-filled days', () => {
    const meals = [
      meal('2026-07-11', 'lunch', [item(500)]),
      meal('2026-07-09', 'lunch', [item(300)]),
    ];
    const s = caloriesByDay(meals, 3, '2026-07-11');
    expect(s.map((d) => d.date)).toEqual(['2026-07-09', '2026-07-10', '2026-07-11']);
    expect(s.map((d) => d.calories)).toEqual([300, 0, 500]);
  });

  it('aggregates multiple meals on the same day', () => {
    const meals = [
      meal('2026-07-11', 'lunch', [item(500)]),
      meal('2026-07-11', 'dinner', [item(400)]),
    ];
    expect(caloriesByDay(meals, 1, '2026-07-11')[0].calories).toBe(900);
  });
});

describe('macroDistribution', () => {
  it('computes kcal (4/4/9) and percentages', () => {
    const meals = [meal('2026-07-11', 'lunch', [item(0, 100, 100, 0)])]; // 400+400 kcal
    const dist = macroDistribution(meals);
    const protein = dist.find((d) => d.id === 'protein');
    const fat = dist.find((d) => d.id === 'fat');
    expect(protein.kcal).toBe(400);
    expect(protein.pct).toBe(50);
    expect(fat.pct).toBe(0);
  });

  it('respects the date range', () => {
    const meals = [
      meal('2026-07-01', 'lunch', [item(0, 100, 0, 0)]),
      meal('2026-07-11', 'lunch', [item(0, 0, 100, 0)]),
    ];
    const dist = macroDistribution(meals, '2026-07-10', '2026-07-11');
    expect(dist.find((d) => d.id === 'protein').grams).toBe(0);
    expect(dist.find((d) => d.id === 'carbs').grams).toBe(100);
  });
});

describe('mealTypeDistribution', () => {
  it('splits kcal by meal type', () => {
    const meals = [
      meal('2026-07-11', 'breakfast', [item(300)]),
      meal('2026-07-11', 'dinner', [item(700)]),
    ];
    const dist = mealTypeDistribution(meals);
    expect(dist.find((d) => d.id === 'breakfast').pct).toBe(30);
    expect(dist.find((d) => d.id === 'dinner').pct).toBe(70);
  });
});

describe('goalAdherence', () => {
  it('counts only tracked days and 85%-110% hits', () => {
    const meals = [
      meal('2026-07-11', 'lunch', [item(2000)]), // בדיוק ביעד
      meal('2026-07-10', 'lunch', [item(1000)]), // נמוך מדי
      // 2026-07-09 — לא נרשם כלום
    ];
    const a = goalAdherence(meals, { calories: 2000 }, 3, '2026-07-11');
    expect(a.trackedDays).toBe(2);
    expect(a.hitDays).toBe(1);
    expect(a.avgCalories).toBe(1500);
  });
});

describe('encouragementMessage', () => {
  const goals = { calories: 2000, protein: 150 };
  it('prompts to start when nothing logged', () => {
    expect(encouragementMessage({ calories: 0, protein: 0 }, goals)).toContain('בתיאבון');
  });
  it('celebrates protein goal', () => {
    expect(encouragementMessage({ calories: 1800, protein: 160 }, goals)).toContain('חלבון');
  });
  it('shows remaining calories', () => {
    expect(encouragementMessage({ calories: 1600, protein: 100 }, goals)).toContain('400');
  });
  it('celebrates hitting the target', () => {
    expect(encouragementMessage({ calories: 2050, protein: 100 }, goals)).toContain('🎯');
  });
  it('warns on big overshoot', () => {
    expect(encouragementMessage({ calories: 2500, protein: 100 }, goals)).toContain('חרגת');
  });
});
