import { describe, expect, it } from 'vitest';

import {
  generateFibonacciScale,
  generateFluidScale,
  generateScale,
  resolveRatio,
  stepName
} from './scale';

describe('scale', () => {
  it('resolves named and custom ratios', () => {
    expect(resolveRatio('golden')).toEqual({ name: 'golden', value: (1 + Math.sqrt(5)) / 2 });
    expect(resolveRatio('1.5')).toEqual({ name: 'custom', value: 1.5 });
    expect(() => resolveRatio('unknown')).toThrow('Unknown ratio');
  });

  it('maps natural and signed step names predictably', () => {
    expect(stepName(-1, 'natural')).toBe('xs');
    expect(stepName(0, 'natural')).toBe('base');
    expect(stepName(3, 'signed')).toBe('3');
  });

  it('generates modular scales with stable token names and metadata', () => {
    const result = generateScale({
      base: 16,
      ratio: 'major-third',
      steps: 2,
      down: 1,
      unit: 'px',
      prefix: 'space',
      naming: 'signed'
    });

    expect(result.meta.ratioName).toBe('major-third');
    expect(result.scale).toHaveLength(4);
    expect(result.scale[0].token).toBe('--space-n1');
    expect(result.scale.at(-1)?.token).toBe('--space-2');
  });

  it.each([
    { name: 'equal endpoints', vwMin: 320, vwMax: 320 },
    { name: 'reversed endpoints', vwMin: 480, vwMax: 320 },
    { name: 'negative minimum', vwMin: -1, vwMax: 1440 },
    { name: 'NaN minimum', vwMin: Number.NaN, vwMax: 1440 },
    { name: 'NaN maximum', vwMin: 320, vwMax: Number.NaN },
    { name: 'infinite minimum', vwMin: Number.POSITIVE_INFINITY, vwMax: 1440 },
    { name: 'infinite maximum', vwMin: 320, vwMax: Number.POSITIVE_INFINITY },
    { name: 'negative infinite minimum', vwMin: Number.NEGATIVE_INFINITY, vwMax: 1440 },
    { name: 'negative infinite maximum', vwMin: 320, vwMax: Number.NEGATIVE_INFINITY }
  ])('rejects invalid fluid viewport widths: $name', ({ vwMin, vwMax }) => {
    expect(() => generateFluidScale({ vwMin, vwMax })).toThrow();
  });

  it('accepts a zero minimum viewport and emits finite fluid CSS', () => {
    const result = generateFluidScale({ vwMin: 0, vwMax: 1440 });

    expect(result.meta.vwMin).toBe(0);
    expect(result.meta.vwMax).toBe(1440);
    expect(result.scale.length).toBeGreaterThan(0);
    for (const step of result.scale) {
      expect(step.clamp).toMatch(/^clamp\(/);
      expect(step.clamp).not.toMatch(/NaN|Infinity/);
      expect(Number.isFinite(step.pxMin)).toBe(true);
      expect(Number.isFinite(step.pxMax)).toBe(true);
    }
  });

  it('generates fibonacci and fluid variants', () => {
    const fibonacci = generateFibonacciScale({ base: 16, steps: 2, down: 1 });
    const fluid = generateFluidScale({ baseMin: 14, baseMax: 18, steps: 2, down: 1 });

    expect(fibonacci.meta.ratioName).toBe('fibonacci');
    expect(fibonacci.scale[0].token).toMatch(/^--space-/);
    expect(fluid.meta.unit).toBe('clamp');
    expect(fluid.scale[0].clamp).toContain('clamp(');
    expect(fluid.scale[0].pxMax).toBeGreaterThan(fluid.scale[0].pxMin);
  });
});
