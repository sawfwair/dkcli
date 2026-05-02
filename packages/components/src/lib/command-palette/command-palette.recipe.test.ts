import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import {
  createCommandPaletteRegistration,
  getCommandPaletteRecipeCase
} from './command-palette.recipe.js';

describe('command palette recipe', () => {
  it('compiles light and dark command-palette cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'command-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'command-dark',
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
      const registration = createCommandPaletteRegistration(theme);
      expect(getCommandPaletteRecipeCase(registration.recipe).caseKey).toBe('');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
