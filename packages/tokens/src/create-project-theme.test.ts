import { describe, expect, it } from 'vitest';
import { createProjectTheme } from './create-project-theme.ts';
import { emitThemeCss } from './emit-css.ts';
import type { ProjectTheme } from '@dkcli/core';
const config: ProjectTheme = { name: 'Authored', seed: { color: '#c44724', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' }, fonts: { body: 'system-ui, sans-serif', display: 'Georgia, serif', mono: 'monospace' } };
describe('project theme compilation', () => {
  it('compiles semantic overrides and font stacks into exported CSS', () => {
    const theme = createProjectTheme({ ...config, overrides: { color: { primary: '#111111' }, radius: { md: '8px' }, type: { base: '18px' }, motion: { fast: '60ms' } } });
    const css = emitThemeCss(theme);
    expect(css).toContain('--color-primary: #111111;');
    expect(css).toContain('--radius-md: 8px;');
    expect(css).toContain('--type-base: 18px;');
    expect(css).toContain('--type-font-display: Georgia, serif;');
    expect(css).toContain('--motion-fast: 60ms;');
    expect(config).not.toHaveProperty('overrides');
  });
  it('gives motion presets actual duration values including reduced motion', () => {
    expect(createProjectTheme({ ...config, seed: { ...config.seed, motion: 'calm' } }).families.motion.normal).toBe('300ms');
    expect(createProjectTheme({ ...config, seed: { ...config.seed, motion: 'reduced' } }).families.motion.slow).toBe('0ms');
  });
  const invalidOverrides: NonNullable<ProjectTheme['overrides']>[] = [
    { color: { invented: '#111111' } }, { color: { primary: 'banana' } },
    { radius: { md: '-2px' } }, { motion: { normal: 'banana' } },
    { state: { mode: 'dark' } }, { type: { 'font-body': 'serif' } }
  ];
  it.each(invalidOverrides)('rejects unsupported or incompatible token overrides %j', (overrides) => {
    expect(() => createProjectTheme({ ...config, overrides })).toThrow();
  });
});


describe('project token values supported by mathematical proofs', () => {
  it.each(['#12345', 'rgb(banana)'])('rejects invalid color %s before compiling recipes', (primary) => {
    expect(() => createProjectTheme({ ...config, overrides: { color: { primary } } })).toThrow(/color/i);
  });

  it('rejects a calc length that the recipe compiler cannot resolve', () => {
    expect(() => createProjectTheme({ ...config, overrides: { space: { md: 'calc(8px + 2px)' } } })).toThrow(/length/i);
  });
});


it('rejects a clamp middle expression with unspaced binary operators', () => {
  expect(() => createProjectTheme({ ...config, overrides: { space: { md: 'clamp(8px, 1vw+2px, 24px)' } } })).toThrow(/length/i);
});


it.each(['transparent', 'rgba(0, 0, 0, 0)', '#0000', 'rgba(0, 0, 0, 0.9999)', 'rgb(0 0 0 / none)'])('rejects authored alpha color %s before opaque contrast proofs', (primary) => {
  expect(() => createProjectTheme({ ...config, overrides: { color: { primary } } })).toThrow(/opaque/i);
});


it('rejects a static CSS length that converts to infinity', () => {
  expect(() => createProjectTheme({ ...config, overrides: { space: { md: `${'9'.repeat(400)}px` } } })).toThrow(/length/i);
});

it.each([`${'9'.repeat(400)}ms`, `1${'0'.repeat(306)}s`])('rejects a duration that the mathematical motion proof cannot resolve to finite milliseconds', (normal) => {
  expect(() => createProjectTheme({ ...config, overrides: { motion: { normal } } })).toThrow(/duration/i);
});
