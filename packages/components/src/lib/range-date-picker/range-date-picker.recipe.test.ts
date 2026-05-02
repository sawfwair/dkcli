import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import {
  createRangeDatePickerRegistration,
  getRangeDatePickerRecipeCase
} from './range-date-picker.recipe.js';

describe('range date picker recipe', () => {
  it('compiles light and dark range-date-picker cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'range-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'range-dark',
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
      const registration = createRangeDatePickerRegistration(theme);
      expect(
        getRangeDatePickerRecipeCase(registration.recipe, { size: 'md' }).caseKey
      ).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
