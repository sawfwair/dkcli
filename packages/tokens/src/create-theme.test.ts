import { describe, expect, it } from 'vitest';

import { createTheme } from './create-theme.ts';
import { emitThemeCss } from './emit-css.ts';

describe('@dkcli/tokens createTheme', () => {
  it.each([
    ['snappy', ['120ms', '200ms', '320ms']],
    ['reduced', ['0ms', '0ms', '0ms']],
    ['calm', ['180ms', '300ms', '480ms']],
    ['expressive', ['160ms', '280ms', '440ms']]
  ] as const)('exports the authored %s motion preset', (motion, durations) => {
    const contract = createTheme({
      name: 'Motion',
      seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion }
    });
    const css = emitThemeCss(contract);
    expect([contract.families.motion.fast, contract.families.motion.normal, contract.families.motion.slow]).toEqual(durations);
    expect(contract.seed.motion).toBe(motion);
    expect(contract.families.motion.preset).toBe(motion);
    expect(css).toContain(`--motion-normal: ${durations[1]};`);
  });

  it.each(['smooth', 'custom-motion', 'toString', '__proto__'])('retains complete fallback durations and metadata for legacy preset %s', (motion) => {
    const contract = createTheme({
      name: 'Legacy motion',
      seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion }
    });
    expect([contract.families.motion.fast, contract.families.motion.normal, contract.families.motion.slow]).toEqual(['120ms', '200ms', '320ms']);
    expect(contract.seed.motion).toBe(motion);
    expect(contract.families.motion.preset).toBe(motion);
    expect(emitThemeCss(contract)).toContain('--motion-normal: 200ms;');
  });

  it('keeps compiled seed metadata independent of later caller edits', () => {
    const seed = { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' } as const;
    const input = { ...seed };
    const contract = createTheme({ name: 'Snapshot', seed: input });
    Object.assign(input, { color: '#c44724', mode: 'dark', motion: 'reduced' });
    expect(contract.seed).toEqual(seed);
    expect(contract.seed.mode).toBe(contract.meta.mode);
    expect(contract.seed.motion).toBe(contract.families.motion.preset);
  });

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

  it('emits alias-to-alias references as CSS variables', () => {
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
    const css = emitThemeCss(contract);

    expect(css).toContain('--floating-bg: var(--overlay-bg);');
    expect(css).toContain('--calendar-trigger-bg: var(--field-bg);');
    expect(css).toContain('--command-query-bg: var(--field-bg);');
    expect(css).toContain('--overlay-bg: var(--color-surface-bright);');
    expect(css).toContain('--field-bg: var(--color-surface);');
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
