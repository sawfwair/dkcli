import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createProgressRegistration, getProgressRecipeCase } from './progress.recipe.js';

describe('progress recipe', () => {
  it('compiles light and dark progress cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'progress-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'progress-dark',
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
      const registration = createProgressRegistration(theme);
      expect(getProgressRecipeCase(registration.recipe, { tone: 'brand', size: 'md' }).caseKey).toContain(
        'tone=brand'
      );
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
