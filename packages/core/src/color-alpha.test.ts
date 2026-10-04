import { describe, expect, it } from 'vitest';
import { cssColorAlpha, parseCssColor } from './color.ts';

describe('CSS color alpha evidence', () => {
  it.each([
    ['#112233', 1], ['rgb(0 0 0 / 50%)', 0.5],
    ['transparent', 0], ['#0000', 0], ['rgba(0, 0, 0, 0.9999)', 0.9999], ['rgb(0 0 0 / none)', 0]
  ] as const)('retains original opacity for %s', (color, alpha) => {
    expect(cssColorAlpha(color)).toBe(alpha);
  });

  it('distinguishes near-opaque input after hexadecimal conversion rounds its alpha', () => {
    const input = 'rgba(0, 0, 0, 0.9999)';
    expect(cssColorAlpha(parseCssColor(input).hex)).toBe(1);
    expect(cssColorAlpha(input)).toBeLessThan(1);
  });

  it('preserves the existing parsed-color JSON fields', () => {
    expect(Object.keys(parseCssColor('#112233')).sort()).toEqual(['cam16Ucs', 'css', 'gamut', 'hex', 'jzazbz', 'oklch']);
  });
});
