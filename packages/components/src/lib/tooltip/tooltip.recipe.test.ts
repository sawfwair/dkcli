import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createTooltipRegistration } from './tooltip.recipe.js';

describe('tooltip recipe', () => {
  it('compiles light and dark tooltip recipes with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'tooltip-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'tooltip-dark',
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
      expect(createTooltipRegistration(theme).recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
