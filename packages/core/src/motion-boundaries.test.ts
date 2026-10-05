import { describe, expect, it } from 'vitest';
import { cubicBezierToLinear, generateSpring, SPRING_PRESETS } from './ease.ts';
import { generateMinimumJerk } from './jerk.ts';

describe('motion generation boundaries', () => {
  it('preserves positive sub-millisecond durations rather than rounding them to zero', () => {
    expect(generateMinimumJerk(0.0001).duration).toBe(0.0001);
    expect(generateMinimumJerk(0.0001).css).toContain('transition-duration: 0.0001s;');
    const spring = generateSpring({ mass: 1, stiffness: 1e16, damping: 2e8 });
    expect(spring.duration).toBeGreaterThan(0);
    expect(spring.css).not.toContain('Duration: 0.000s');
  });
  it.each([
    { mass: 0, stiffness: 180, damping: 12 },
    { mass: 1, stiffness: -180, damping: 12 },
    { mass: 1, stiffness: 180, damping: 0 },
    { mass: Number.POSITIVE_INFINITY, stiffness: 180, damping: 12 },
    { mass: 1, stiffness: Number.NaN, damping: 12 }
  ])('rejects a spring without a finite settling model %j', (params) => {
    expect(() => generateSpring(params)).toThrow();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 10_001])('rejects invalid sample intervals %s', (samples) => {
    expect(() => generateSpring(SPRING_PRESETS.snappy, samples)).toThrow();
    expect(() => generateMinimumJerk(0.6, samples)).toThrow();
    expect(() => cubicBezierToLinear(0.25, 0.1, 0.25, 1, samples)).toThrow();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid minimum-jerk duration %s', (duration) => {
    expect(() => generateMinimumJerk(duration)).toThrow();
  });

  it('retains a finite slow settling trajectory for a strongly overdamped spring', () => {
    const result = generateSpring({ mass: 1, stiffness: 1, damping: 1e9 }, 20);
    expect(result.duration).toBeGreaterThan(1e9);
    expect(result.samples[0]).toBe(0);
    expect(result.samples[10]).toBeGreaterThan(0.9);
    expect(result.samples.every(Number.isFinite)).toBe(true);
    expect(result.samples.at(-1)).toBe(1);
  });

  it('rejects invalid CSS bezier x coordinates while preserving y overshoot', () => {
    expect(() => cubicBezierToLinear(-0.1, 0, 1, 1)).toThrow();
    expect(() => cubicBezierToLinear(0, 0, 1.1, 1)).toThrow();
    expect(() => cubicBezierToLinear(0, Number.NaN, 1, 1)).toThrow();
    expect(cubicBezierToLinear(0.3, -0.3, 0.7, 1.3).samples.every(Number.isFinite)).toBe(true);
  });
});
