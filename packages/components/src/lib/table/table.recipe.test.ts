import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createTableRegistration, getTableRecipeCase } from './table.recipe.js';

describe('table recipe', () => {
  it('compiles light and dark table cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'table-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'table-dark',
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
      const registration = createTableRegistration(theme);
      expect(getTableRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
