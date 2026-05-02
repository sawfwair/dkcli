import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createCardRegistration, getCardRecipeCase } from './card.recipe.js';

describe('card recipe', () => {
  it('compiles padding and surface cases for light and dark themes', () => {
    const light = createTheme({
      name: 'card-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'card-dark',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'dark',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    const lightRegistration = createCardRegistration(light);
    const darkRegistration = createCardRegistration(dark);

    expect(Object.keys(lightRegistration.recipe.cases)).toHaveLength(9);
    expect(Object.keys(darkRegistration.recipe.cases)).toHaveLength(9);

    const compiledCase = getCardRecipeCase(lightRegistration.recipe, {
      padding: 'md',
      surface: 'raised'
    });
    expect(compiledCase.slots.root.baseVars['--dk-card-bg']).toMatch(/^#/);
    expect(darkRegistration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
