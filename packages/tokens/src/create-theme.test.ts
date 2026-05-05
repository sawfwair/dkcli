import { describe, expect, it } from 'vitest';

import { createTheme } from './create-theme.ts';
import { emitThemeCss } from './emit-css.ts';

describe('@dkcli/tokens createTheme', () => {
  it('compiles actual palette and scale families from the seed', () => {
    const contract = createTheme({
      name: 'Ocean',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    expect(contract.meta.optimizedSeed).toMatch(/^#/);
    expect(contract.meta.paletteScore).toBeGreaterThan(0);
    expect(contract.families.color['primary-500']).toMatch(/^#/);
    expect(String(contract.families.space.base)).toContain('clamp(');
    expect(String(contract.families.type.base)).toContain('clamp(');
    expect(contract.aliases.primary).toBe('color.primary');
  });

  it('emits semantic alias variables as CSS var references', () => {
    const contract = createTheme({
      name: 'Night',
      seed: {
        color: '#295dff',
        ratio: 'golden',
        mode: 'dark',
        density: 'compact',
        motion: 'calm'
      }
    });
    const css = emitThemeCss(contract);

    expect(css).toContain('--color-primary-500:');
    expect(css).toContain('--space-base:');
    expect(css).toContain('--primary: var(--color-primary);');
    expect(css).toContain('--control-radius: var(--radius-md);');
  });

  it('rejects CSS declaration breakout values in custom theme contracts', () => {
    const contract = createTheme({
      name: 'Night',
      seed: {
        color: '#295dff',
        ratio: 'golden',
        mode: 'dark',
        density: 'compact',
        motion: 'calm'
      }
    });
    contract.families.color.primary = 'red; } body { outline: 1px solid red; }';

    expect(() => emitThemeCss(contract)).toThrow(/Unsafe CSS value/);
  });
});
