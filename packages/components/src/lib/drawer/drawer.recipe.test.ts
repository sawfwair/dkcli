import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createDrawerRegistration, getDrawerRecipeCase } from './drawer.recipe.js';

describe('drawer recipe', () => {
  it('compiles light and dark drawer cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'drawer-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'drawer-dark',
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
      const registration = createDrawerRegistration(theme);
      expect(
        getDrawerRecipeCase(registration.recipe, { size: 'md', side: 'right' }).caseKey
      ).toContain('side=right');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
