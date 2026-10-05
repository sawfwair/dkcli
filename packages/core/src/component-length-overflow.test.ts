import { describe, expect, it } from 'vitest';

import { compileComponentRecipe } from './component-compiler.ts';
import type { ComponentSpec } from './component-spec.ts';
import type { ThemeContract } from './theme-contract.ts';

const theme: ThemeContract = {
  name: 'length-regression',
  seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
  meta: { density: 'comfortable', mode: 'light', optimizedSeed: '#295dff', paletteScore: 1, ratioName: 'perfect fourth', ratioValue: 1.333 },
  families: { color: {}, elevation: {}, motion: {}, radius: {}, space: {}, state: {}, type: {} },
  aliases: {}
};

function lengthSpec(length: string | number, field: 'minSize' | 'actualSize' = 'actualSize'): ComponentSpec {
  return {
    id: 'length',
    slots: [{ name: 'root', kind: 'container', required: true }], axes: [], states: ['rest'],
    recipe: { root: [{ style: { '--dk-length-block-size': { literal: '44px' } } }] },
    proofs: { target: [{ target: 'root', minSize: 1, actualSize: 44, modality: 'touch', [field]: { literal: length } }] },
    a11y: { role: 'group' }
  };
}

const finiteOverflow = `1${'0'.repeat(308)}`;
const nonfinitePixels = `${'9'.repeat(400)}px`;

describe('component length unit conversion', () => {
  it.each(['rem', 'em'])('rejects finite %s values that overflow during pixel conversion', (unit) => {
    expect(Number.isFinite(Number(finiteOverflow))).toBe(true);
    expect(Number.isFinite(Number(finiteOverflow) * 16)).toBe(false);
    expect(() => compileComponentRecipe(lengthSpec(`${finiteOverflow}${unit}`), theme)).toThrow(/finite|numeric length/i);
  });

  it('rejects pixel literals that parse to infinity before conversion', () => {
    expect(Number.isFinite(Number(nonfinitePixels.slice(0, -2)))).toBe(false);
    expect(() => compileComponentRecipe(lengthSpec(nonfinitePixels), theme)).toThrow(/finite|numeric length/i);
  });

  it.each([Infinity, NaN])('rejects nonfinite numeric target lengths (%s)', (length) => {
    expect(() => compileComponentRecipe(lengthSpec(length), theme)).toThrow(/finite|numeric length/i);
  });

  it('also rejects an overflowing minimum target size', () => {
    expect(() => compileComponentRecipe(lengthSpec(`${finiteOverflow}rem`, 'minSize'), theme)).toThrow(/finite|numeric length/i);
  });

  it.each([
    ['44px', 44],
    ['2rem', 32],
    ['1.5em', 24],
    [`1${'0'.repeat(300)}px`, 1e300],
    [`1${'0'.repeat(300)}rem`, 1.6e301],
    [`1${'0'.repeat(300)}em`, 1.6e301]
  ] as const)('preserves finite length %s', (length, expected) => {
    const [fixture] = compileComponentRecipe(lengthSpec(length), theme).proofFixtures;
    expect(fixture.target[0].actualSizePx).toBe(expected);
    expect(Number.isFinite(fixture.target[0].actualSizePx)).toBe(true);
    expect(fixture.target[0].pass).toBe(true);
  });
});
