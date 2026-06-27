import { describe, expect, it } from 'vitest';
import { epley1rm, fmtWeight, toKg, toUnit, workoutVolume } from './utils.js';

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
