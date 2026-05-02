import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createBadgeRegistration, getBadgeRecipeCase } from './badge.recipe.js';

describe('badge recipe', () => {
  it('compiles all tone, emphasis, and size cases across light and dark themes', () => {
    const light = createTheme({
      name: 'badge-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'badge-dark',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'dark',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    const lightRegistration = createBadgeRegistration(light);
    const darkRegistration = createBadgeRegistration(dark);

    expect(Object.keys(lightRegistration.recipe.cases)).toHaveLength(30);
    expect(Object.keys(darkRegistration.recipe.cases)).toHaveLength(30);

    const compiledCase = getBadgeRecipeCase(lightRegistration.recipe, {
      tone: 'brand',
      emphasis: 'soft',
      size: 'md'
    });
    expect(compiledCase.slots.root.baseVars['--dk-badge-bg']).toMatch(/^#/);
    expect(compiledCase.slots.label.baseVars['--dk-badge-label-size']).toContain('clamp');
    expect(darkRegistration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
