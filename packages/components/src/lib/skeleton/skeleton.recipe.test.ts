import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createSkeletonRegistration, getSkeletonRecipeCase } from './skeleton.recipe.js';

describe('skeleton recipe', () => {
  it('compiles light and dark skeleton cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'skeleton-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'skeleton-dark',
        seed: {
          color: '#1f8a70',
          ratio: 'major-third',
          mode: 'dark',
          density: 'compact',
          motion: 'smooth'
        }
      })
    ];

    for (const theme of themes) {
      const registration = createSkeletonRegistration(theme);
      expect(getSkeletonRecipeCase(registration.recipe, { variant: 'text', size: 'md' }).caseKey).toContain(
        'variant=text'
      );
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
