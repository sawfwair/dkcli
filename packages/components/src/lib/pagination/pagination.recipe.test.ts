import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createPaginationRegistration, getPaginationRecipeCase } from './pagination.recipe.js';

describe('pagination recipe', () => {
  it('compiles light and dark pagination cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'pagination-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'pagination-dark',
        seed: {
          color: '#ff6b3d',
          ratio: 'major-third',
          mode: 'dark',
          density: 'comfortable',
          motion: 'smooth'
        }
      })
    ];

    for (const theme of themes) {
      const registration = createPaginationRegistration(theme);
      expect(getPaginationRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
