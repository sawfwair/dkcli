import { describe, expect, it } from 'vitest';

import { getCorrections } from './optical';

describe('optical', () => {
  it('applies the circle enlargement once when all generated declarations are used', () => {
    const corrections = getCorrections('circle', 100).corrections;
    const width = Number.parseFloat(corrections.find((correction) => correction.property === 'width')?.value ?? '100');
    const height = Number.parseFloat(corrections.find((correction) => correction.property === 'height')?.value ?? '100');
    const transform = corrections.find((correction) => correction.property === 'transform')?.value;
    const scale = transform ? Number(transform.match(/^scale\(([^)]+)\)$/)?.[1]) : 1;

    expect(width * scale).toBeCloseTo(112);
    expect(height * scale).toBeCloseTo(112);
  });

  it('returns optical correction recommendations for known element types', () => {
    const result = getCorrections('icon', 48);

    expect(result.type).toBe('icon');
    expect(result.corrections).toHaveLength(2);
    expect(result.description).toContain('Directional icon');
  });

  it('throws on unsupported optical correction types', () => {
    expect(() => getCorrections('unknown', 48)).toThrow('Unknown optical type');
  });
});
