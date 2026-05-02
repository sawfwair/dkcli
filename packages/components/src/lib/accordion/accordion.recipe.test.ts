import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createAccordionRegistration, getAccordionRecipeCase } from './accordion.recipe.js';

describe('accordion recipe', () => {
  it('compiles light and dark recipe cases with passing fixtures', () => {
    const light = createTheme({
      name: 'accordion-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'accordion-dark',
      seed: {
        color: '#ff6b3d',
        ratio: 'major-third',
        mode: 'dark',
        density: 'compact',
        motion: 'smooth'
      }
    });

    for (const theme of [light, dark]) {
      const registration = createAccordionRegistration(theme);
      expect(getAccordionRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
