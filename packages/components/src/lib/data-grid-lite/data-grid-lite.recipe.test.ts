import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createDataGridLiteRegistration, getDataGridLiteRecipeCase } from './data-grid-lite.recipe.js';

describe('data grid lite recipe', () => {
  it('compiles light and dark data-grid-lite cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'grid-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'grid-dark',
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
      const registration = createDataGridLiteRegistration(theme);
      expect(getDataGridLiteRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain(
        'size=md'
      );
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
