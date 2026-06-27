import { describe, expect, it } from 'vitest';
import { canTriggerGymAutoStart, distanceMeters, hasGymLocation, isInsideGymRadius } from './gymAutoStart.js';

describe('gym auto-start helpers', () => {
  it('does not treat blank coordinates as a saved gym location', () => {
    expect(hasGymLocation({ latitude: '', longitude: '', radiusM: 120 })).toBe(false);
    expect(hasGymLocation({ latitude: 0, longitude: 0, radiusM: 120 })).toBe(true);
  });

  it('calculates distance between nearby coordinates in meters', () => {
    const distance = distanceMeters(
      { latitude: 32.0853, longitude: 34.7818 },
      { latitude: 32.0863, longitude: 34.7818 }
    );

    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it('checks whether a coordinate is inside the configured gym radius', () => {
    const config = { latitude: 32.0853, longitude: 34.7818, radiusM: 150 };

    expect(isInsideGymRadius({ latitude: 32.0863, longitude: 34.7818 }, config)).toBe(true);
    expect(isInsideGymRadius({ latitude: 32.09, longitude: 34.7818 }, config)).toBe(false);
  });

  it('allows triggering only after the cooldown window', () => {
    const now = 1000000;

    expect(canTriggerGymAutoStart(now, now - 1000)).toBe(false);
    expect(canTriggerGymAutoStart(now, now - 7 * 60 * 60 * 1000)).toBe(true);
  });
});
