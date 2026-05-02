import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createStepperRegistration, getStepperRecipeCase } from './stepper.recipe.js';

describe('stepper recipe', () => {
  it('compiles light and dark stepper cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'stepper-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'stepper-dark',
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
      const registration = createStepperRegistration(theme);
      expect(
        getStepperRecipeCase(registration.recipe, { size: 'md', orientation: 'horizontal' }).caseKey
      ).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
