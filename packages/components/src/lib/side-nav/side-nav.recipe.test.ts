import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createSideNavRegistration, getSideNavRecipeCase } from './side-nav.recipe.js';

describe('sideNav recipe', () => {
  it('compiles light and dark breadcrumb cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'sideNav-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'sideNav-dark',
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
      const registration = createSideNavRegistration(theme);
      expect(getSideNavRecipeCase(registration.recipe).caseKey).toBe('');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
