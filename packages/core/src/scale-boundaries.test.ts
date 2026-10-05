import { describe, expect, it } from 'vitest';
import { generateFibonacciScale, generateFluidScale, generateScale, resolveRatio } from './scale.ts';

describe('scale input and output boundaries', () => {
  it.each(['toString', 'constructor', '__proto__', 'Infinity'])('rejects a nonnumeric ratio %s', (ratio) => {
    expect(() => resolveRatio(ratio)).toThrow();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -16, 0])('rejects an invalid base %s in both static generators', (base) => {
    expect(() => generateScale({ base })).toThrow();
    expect(() => generateFibonacciScale({ base })).toThrow();
  });

  it.each([{ steps: -1 }, { steps: 1.5 }, { steps: Number.NaN }, { steps: Number.POSITIVE_INFINITY }, { steps: 10_001 }, { down: -1 }, { down: 1.5 }])('rejects invalid step counts %j', (options) => {
    expect(() => generateScale(options)).toThrow();
    expect(() => generateFibonacciScale(options)).toThrow();
    expect(() => generateFluidScale(options)).toThrow();
  });

  it.each([{ unit: 'cm' }, { naming: 'typo' }, { prefix: 'space; color:red' }])('rejects misleading or invalid token options %j', (options) => {
    expect(() => generateScale(options)).toThrow();
    expect(() => generateFibonacciScale(options)).toThrow();
  });

  it.each([{ baseMin: 20, baseMax: 10 }, { baseMin: 0 }, { baseMax: Number.POSITIVE_INFINITY }])('rejects invalid fluid sizes %j', (options) => {
    expect(() => generateFluidScale(options)).toThrow();
  });

  it('rejects finite inputs whose output overflows rather than returning invalid CSS', () => {
    expect(() => generateScale({ base: Number.MAX_VALUE, ratio: '2', down: 0, steps: 1 })).toThrow();
    expect(() => generateFluidScale({ baseMin: Number.MAX_VALUE / 2, baseMax: Number.MAX_VALUE, ratio: '2', down: 0, steps: 1 })).toThrow();
  });

  it('continues Fibonacci growth beyond the precomputed lookup instead of repeating its last value', () => {
    const result = generateFibonacciScale({ base: 16, down: 0, steps: 9, unit: 'px' });
    expect(result.scale.slice(-3).map((step) => step.px)).toEqual([466, 754, 1220]);
    expect(result.scale.every((step) => Number.isFinite(step.px))).toBe(true);
  });
});
