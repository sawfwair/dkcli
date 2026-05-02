import { describe, expect, it } from 'vitest';

import { cubicBezierToLinear, generateSpring } from './ease';

describe('ease', () => {
  it('generates spring timing functions with a settled final sample', () => {
    const result = generateSpring({ mass: 1, stiffness: 180, damping: 12 }, 12);

    expect(result.duration).toBeGreaterThan(0);
    expect(result.samples[0]).toBeCloseTo(0, 3);
    expect(result.samples.at(-1)).toBe(1);
    expect(result.linear).toContain('linear(');
    expect(result.css).toContain('transition-timing-function');
  });

  it('converts cubic beziers into linear samples', () => {
    const result = cubicBezierToLinear(0.25, 0.1, 0.25, 1, 10);

    expect(result.samples[0]).toBeCloseTo(0, 3);
    expect(result.samples.at(-1)).toBeCloseTo(1, 3);
    expect(result.linear).toContain('linear(');
  });
});
