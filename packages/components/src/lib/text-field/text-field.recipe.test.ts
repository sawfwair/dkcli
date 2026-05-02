import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createTextFieldRegistration, getTextFieldRecipeCase } from './text-field.recipe.js';

describe('text field recipe', () => {
  it('compiles all size cases for light and dark themes', () => {
    const light = createTheme({
      name: 'text-field-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'text-field-dark',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'dark',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    const lightRegistration = createTextFieldRegistration(light);
    const darkRegistration = createTextFieldRegistration(dark);

    expect(Object.keys(lightRegistration.recipe.cases)).toHaveLength(4);
    expect(Object.keys(darkRegistration.recipe.cases)).toHaveLength(4);

    const compiledCase = getTextFieldRecipeCase(lightRegistration.recipe, { size: 'md' });
    expect(compiledCase.slots.field.baseVars['--dk-text-field-bg']).toMatch(/^#/);
    expect(compiledCase.slots.field.baseVars['--dk-text-field-input-font-size']).toContain('clamp');
    expect(darkRegistration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
