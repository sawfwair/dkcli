import { describe, expect, it } from 'vitest';

import { getCorrections } from './optical';

describe('optical', () => {
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
