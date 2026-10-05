import { describe, expect, it } from 'vitest';

import { compileComponentRecipe } from './component-compiler.ts';
import type { ComponentSpec } from './component-spec.ts';
import type { ThemeContract } from './theme-contract.ts';

const theme: ThemeContract = {
  name: 'duration-regression',
  seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
  meta: { density: 'comfortable', mode: 'light', optimizedSeed: '#295dff', paletteScore: 1, ratioName: 'perfect fourth', ratioValue: 1.333 },
  families: { color: {}, elevation: {}, motion: {}, radius: {}, space: {}, state: {}, type: {} },
  aliases: {}
};

function durationSpec(duration: string): ComponentSpec {
  return {
    id: 'duration',
    slots: [{ name: 'root', kind: 'container', required: true }], axes: [], states: ['rest'],
    recipe: { root: [{ style: { '--dk-motion-duration': { literal: duration } } }] },
    proofs: { motion: [{ target: 'root', durationMaxMs: Number.MAX_VALUE }] },
    a11y: { role: 'group' }
  };
}

describe('component duration unit conversion', () => {
  it('rejects finite seconds when conversion would emit an infinite millisecond proof', () => {
    const seconds = `1${'0'.repeat(306)}`;
    expect(Number.isFinite(Number(seconds))).toBe(true);
    expect(Number.isFinite(Number(seconds) * 1000)).toBe(false);
    expect(() => compileComponentRecipe(durationSpec(`${seconds}s`), theme)).toThrow(/duration/i);
  });

  it('retains very large durations whose converted milliseconds remain finite', () => {
    const [fixture] = compileComponentRecipe(durationSpec(`1${'0'.repeat(305)}s`), theme).proofFixtures;
    expect(fixture.motion[0].durationMs).toBe(1e308);
    expect(Number.isFinite(fixture.motion[0].durationMs)).toBe(true);
    expect(fixture.motion[0].pass).toBe(true);
  });
});
