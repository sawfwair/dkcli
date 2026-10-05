import { describe, expect, it } from 'vitest';
import { createTheme } from './create-theme.ts';
import { createProjectTheme } from './create-project-theme.ts';
import { emitThemeCss } from './emit-css.ts';
import { emitThemeJson } from './emit-json.ts';

function theme(): ReturnType<typeof createTheme> {
  return createTheme({ name: 'Export', seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' } });
}

describe('theme export integrity', () => {
  it('rejects a nonfinite token instead of exporting Infinity CSS or null JSON', () => {
    const contract = theme();
    contract.families.space.base = Number.POSITIVE_INFINITY;
    expect(() => emitThemeCss(contract)).toThrow();
    expect(() => emitThemeJson(contract)).toThrow();
  });
  it.each<Record<string, string>>([{ a: 'b', b: 'a' }, { a: 'space.missing' }])('rejects unresolved aliases %j on both export paths', (aliases) => {
    const contract = theme();
    contract.aliases = aliases;
    expect(() => emitThemeCss(contract)).toThrow();
    expect(() => emitThemeJson(contract)).toThrow();
  });
  it('rejects a fluid override with a nonfinite affine coefficient despite finite clamp bounds', () => {
    const contract = theme();
    expect(() => createProjectTheme({ name: 'Export', seed: contract.seed, fonts: { body: 'sans-serif', display: 'serif', mono: 'monospace' }, overrides: { space: { base: `clamp(1rem, 1rem + ${'1'.repeat(400)}vw, 2rem)` } } })).toThrow();
  });
});
