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
