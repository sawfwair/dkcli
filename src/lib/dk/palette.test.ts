import { describe, expect, it } from 'vitest';

import { type ColorResult } from './color';
import {
  STOPS,
  generateHarmony,
  generateNeutral,
  generateStates,
  generateTonal,
  optimizePalette,
  semanticDark,
  semanticLight
} from './palette';

describe('palette', () => {
  it('builds complete tonal and neutral scales for all configured stops', () => {
    const tonal = generateTonal('#3b82f6');
    const neutral = generateNeutral('#3b82f6');

    expect(Object.keys(tonal).map(Number)).toEqual(STOPS);
    expect(Object.keys(neutral).map(Number)).toEqual(STOPS);
    expect(tonal[500].hex).toMatch(/^#/);
    expect(neutral[500].c).toBeCloseTo(0.007, 3);
  });

  it('builds semantic token sets from tonal scales', () => {
    const tonal = generateTonal('#3b82f6');
    const neutral = generateNeutral('#3b82f6');
    const light = semanticLight(tonal, neutral);
    const dark = semanticDark(tonal, neutral);

    expect(light.primary).toEqual(tonal[500]);
    expect(dark.primary).toEqual(tonal[300]);
    expect(light['on-primary']).toBeTypeOf('string');
    expect((dark.surface as ColorResult).hex).toBe(neutral[950].hex);
  });

  it('builds state colors with readable foreground tokens', () => {
    const states = generateStates();
    const error = states.error as ColorResult;
    const success = states.success as ColorResult;

    expect(states['on-error']).toBeTypeOf('string');
    expect(error.hex).toMatch(/^#/);
    expect(success.hex).toMatch(/^#/);
  });

  it('creates harmonic palettes with predictable labels', () => {
    const harmony = generateHarmony('#3b82f6', 'triadic');

    expect(harmony.type).toBe('triadic');
    expect(harmony.colors).toHaveLength(3);
    expect(harmony.colors.map((color) => color.label)).toEqual([
      'primary',
      'secondary',
      'tertiary'
    ]);
  });

  it('optimizes advanced palettes with contrast and distinction scores', () => {
    const palette = optimizePalette('#3b82f6', {
      engine: 'advanced',
      goal: 'viz',
      gamut: 'srgb',
      space: 'oklch',
      cvdModel: 'machado',
      optimize: true
    });

    expect(palette.seedHex).toMatch(/^#/);
    expect(palette.scores.apca).toBeGreaterThan(0.5);
    expect(palette.scores.distinctness).toBeGreaterThan(0.4);
  });
});
