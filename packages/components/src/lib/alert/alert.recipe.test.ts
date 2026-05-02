import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createAlertRegistration, getAlertRecipeCase } from './alert.recipe.js';

describe('alert recipe', () => {
  it('compiles tone cases for light and dark themes', () => {
    const light = createTheme({
      name: 'alert-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'alert-dark',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'dark',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    const lightRegistration = createAlertRegistration(light);
    const darkRegistration = createAlertRegistration(dark);

    expect(Object.keys(lightRegistration.recipe.cases)).toHaveLength(5);
    expect(Object.keys(darkRegistration.recipe.cases)).toHaveLength(5);

    const compiledCase = getAlertRecipeCase(lightRegistration.recipe, { tone: 'danger' });
    expect(compiledCase.slots.root.baseVars['--dk-alert-bg']).toMatch(/^#/);
    expect(darkRegistration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
