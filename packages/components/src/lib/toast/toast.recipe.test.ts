import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createToastRegistration, getToastRecipeCase } from './toast.recipe.js';

describe('toast recipe', () => {
  it('compiles light and dark toast recipes with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'toast-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'toast-dark',
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
      const registration = createToastRegistration(theme);
      expect(getToastRecipeCase(registration.recipe, { placement: 'bottom-right' }).caseKey).toContain('placement=bottom-right');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
