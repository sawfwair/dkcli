import { describe, expect, it } from 'vitest';
import { resolveTokenExpr } from './component-compiler.ts';
import type { ThemeContract } from './theme-contract.ts';

function theme(): ThemeContract {
  return {
    name: 'Fluid', seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
    meta: { optimizedSeed: '#295dff', paletteScore: 1, mode: 'light', density: 'comfortable', ratioName: 'perfect-fourth', ratioValue: 4 / 3 },
    families: { color: {}, space: { base: 'clamp(1rem, 0.5rem + 1vw, 2rem)' }, type: {}, radius: {}, elevation: {}, motion: {}, state: {} },
    aliases: { spacing: 'space.base', a: 'b', b: 'a' }
  };
}

describe('theme expression boundaries', () => {
  it('scales the complete responsive length rather than freezing its maximum bound', () => {
    expect(resolveTokenExpr(theme(), { mul: [{ alias: 'spacing' }, 0.5] })).toBe('clamp(0.5rem, 0.25rem + 0.5vw, 1rem)');
  });

  it('preserves affine units and reverses bounds when a responsive length is multiplied negatively', () => {
    expect(resolveTokenExpr(theme(), { mul: [{ literal: 'clamp(8px, calc(4px + 1vw - 0.5vh), 16px)' }, -0.5] })).toBe('clamp(-8px, -2px - 0.5vw + 0.25vh, -4px)');
  });

  it.each(['space.toString', 'constructor.foo', 'space.base.extra', 'toString'])('rejects malformed or inherited reference %s', (ref) => {
    expect(() => resolveTokenExpr(theme(), { ref })).toThrow();
  });

  it('reports genuine alias cycles and rejects nonfinite scaling before CSS emission', () => {
    expect(() => resolveTokenExpr(theme(), { alias: 'a' })).toThrow(/Circular/);
    expect(() => resolveTokenExpr(theme(), { mul: [{ literal: '10px' }, Number.POSITIVE_INFINITY] })).toThrow();
    expect(() => resolveTokenExpr(theme(), { mul: [{ literal: '10px' }, Number.MAX_VALUE] })).toThrow();
  });
});
