import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createInlineEditRegistration, getInlineEditRecipeCase } from './inline-edit.recipe.js';

describe('inline edit recipe', () => {
  it('compiles light and dark inline-edit cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'inline-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'inline-dark',
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
      const registration = createInlineEditRegistration(theme);
      expect(getInlineEditRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain(
        'size=md'
      );
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
