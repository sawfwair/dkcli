import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createDatePickerRegistration, getDatePickerRecipeCase } from './date-picker.recipe.js';

describe('date-picker recipe', () => {
  it('compiles light and dark date-picker cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'date-picker-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'date-picker-dark',
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
      const registration = createDatePickerRegistration(theme);
      expect(getDatePickerRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain(
        'size=md'
      );
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
