import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createComboboxRegistration, getComboboxRecipeCase } from './combobox.recipe.js';

describe('combobox recipe', () => {
  it('compiles light and dark combobox cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'combobox-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'combobox-dark',
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
      const registration = createComboboxRegistration(theme);
      expect(getComboboxRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
