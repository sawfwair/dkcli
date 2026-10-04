import { describe, expect, it } from 'vitest';
import { computeAnchoredPosition } from './anchored-positioner.js';

describe('anchored surface cross-axis bounds', () => {
  it('keeps a vertically fitting bottom surface within the phone viewport', () => {
    const result = computeAnchoredPosition({ anchor: { left: 43.58, top: 80, width: 232, height: 48 }, surface: { width: 288, height: 280 }, placement: 'bottom', offset: 8, viewportWidth: 320, viewportHeight: 960 });
    expect(result).toEqual({ left: 24, top: 136, placement: 'bottom' });
  });

  it('keeps a horizontally fitting right surface within the vertical viewport', () => {
    const result = computeAnchoredPosition({ anchor: { left: 20, top: 900, width: 44, height: 44 }, surface: { width: 200, height: 180 }, placement: 'right', offset: 8, viewportWidth: 320, viewportHeight: 960 });
    expect(result).toEqual({ left: 72, top: 772, placement: 'right' });
  });

  it('converts physical browser bounds to CSS positions under root CSS zoom', () => {
    const result = computeAnchoredPosition({ anchor: { left: 43.58, top: 80, width: 232, height: 48 }, surface: { width: 288, height: 280 }, placement: 'bottom', offset: 8, viewportWidth: 320, viewportHeight: 960, coordinateScale: 2 });
    expect(result).toEqual({ left: 12, top: 68, placement: 'bottom' });
  });
});
