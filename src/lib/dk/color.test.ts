import { describe, expect, it } from 'vitest';

import {
  apcaCheck,
  apcaContrast,
  autoContrast,
  autoContrastAPCA,
  contrastRatio,
  gamutClip,
  hexToCam16Ucs,
  hexToJzazbz,
  hexToOklch,
  hexToY,
  parseCssColor,
  hexToSrgb,
  makeColor,
  oklchInGamut,
  oklchToHex
} from './color';

describe('color', () => {
  it('parses shorthand hex colors into normalized sRGB values', () => {
    expect(hexToSrgb('#abc')).toEqual([170 / 255, 187 / 255, 204 / 255]);
  });

  it('round-trips hex through OKLCH within a tight tolerance', () => {
    const original = '#3b82f6';
    const oklch = hexToOklch(original);
    const roundTrip = oklchToHex(...oklch);
    const [originalL, , originalH] = oklch;
    const [roundTripL, , roundTripH] = hexToOklch(roundTrip);

    expect(roundTripL).toBeCloseTo(originalL, 2);
    expect(Math.abs(roundTripH - originalH)).toBeLessThan(5);
    expect(roundTrip).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('clips out-of-gamut colors back into gamut', () => {
    const clipped = gamutClip(0.62, 0.4, 20);

    expect(oklchInGamut(...clipped)).toBe(true);
    expect(clipped[1]).toBeLessThanOrEqual(0.4);
  });

  it('chooses high-contrast foregrounds for light and dark backgrounds', () => {
    expect(autoContrast('#111827')).toBe('#ffffff');
    expect(autoContrast('#f8fafc')).toBe('#0a0a0a');
    expect(autoContrastAPCA('#111827')).toBe('#ffffff');
  });

  it('computes strong contrast checks for readable text', () => {
    const result = apcaContrast('#111111', '#ffffff');
    const check = apcaCheck(result.Lc, 16, 400);

    expect(result.abs).toBeGreaterThan(90);
    expect(check.pass).toBe(true);
    expect(contrastRatio('#111111', '#ffffff')).toBeGreaterThan(15);
  });

  it('builds clipped color objects with formatted output', () => {
    const color = makeColor(0.57, 0.2, 240);

    expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(color.oklch).toMatch(/^oklch\(/);
    expect(oklchInGamut(color.l, color.c, color.h)).toBe(true);
  });

  it('parses modern CSS color syntax and exposes advanced color spaces', () => {
    const parsed = parseCssColor('color(display-p3 0.2 0.5 0.9)', 'p3');
    const cam16 = hexToCam16Ucs('#3b82f6');
    const jz = hexToJzazbz('#3b82f6');

    expect(parsed.gamut).toBe('p3');
    expect(parsed.css).toContain('color(');
    expect(cam16).toHaveLength(3);
    expect(jz).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// APCA regression tests — known-good values from the official apca-w3 package
// (version 0.1.9, SA98G constants). These anchor dk's output to the W3
// reference implementation and will fail if the algorithm ever drifts.
// ---------------------------------------------------------------------------
describe('APCA regression against apca-w3 reference', () => {
  // Reverse polarity: light text on dark background (WoB)
  // bg = #050302, reference values from apca-w3 APCAcontrast()
  const wobCases: [string, string, number][] = [
    ['#E3DDD8', '#050302', -86.6],
    ['#CAC4BF', '#050302', -71.5],
    ['#8C8680', '#050302', -38.1],
    ['#F2AE6E', '#050302', -66.5],
    ['#ED9658', '#050302', -56.9],
    ['#F6B894', '#050302', -71.8],
    ['#FFFFFF', '#050302', -107.9],
  ];

  it.each(wobCases)(
    'WoB: %s on %s should be Lc %s',
    (fg, bg, expectedLc) => {
      const result = apcaContrast(fg, bg);
      expect(result.Lc).toBeCloseTo(expectedLc, 0);
      expect(result.polarity).toBe('dark-bg');
    }
  );

  // Normal polarity: dark text on light background (BoW)
  const bowCases: [string, string, number][] = [
    ['#111111', '#ffffff', 105.4],
    ['#333333', '#f0f0f0', 89.8],
    ['#000000', '#ffffff', 106.0],
  ];

  it.each(bowCases)(
    'BoW: %s on %s should be Lc %s',
    (fg, bg, expectedLc) => {
      const result = apcaContrast(fg, bg);
      expect(result.Lc).toBeCloseTo(expectedLc, 0);
      expect(result.polarity).toBe('light-bg');
    }
  );

  it('returns zero contrast for identical colors', () => {
    const result = apcaContrast('#808080', '#808080');
    expect(result.Lc).toBe(0);
  });

  it('hexToY uses simple 2.4 gamma, not piecewise sRGB TRC', () => {
    // For #808080 (128/255 ≈ 0.502), simple 2.4 and piecewise sRGB diverge:
    //   simple 2.4:  pow(0.502, 2.4) ≈ 0.2140
    //   piecewise:   pow((0.502+0.055)/1.055, 2.4) ≈ 0.2159
    const y = hexToY('#808080');
    const chanLinear = Math.pow(128 / 255, 2.4);
    const expected =
      0.2126729 * chanLinear +
      0.7151522 * chanLinear +
      0.0721750 * chanLinear;
    expect(y).toBeCloseTo(expected, 4);
  });
});
