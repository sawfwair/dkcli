import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createAvatarRegistration, getAvatarRecipeCase } from './avatar.recipe.js';

describe('avatar recipe', () => {
  it('compiles size and shape cases for light and dark themes', () => {
    const light = createTheme({
      name: 'avatar-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'avatar-dark',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'dark',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    const lightRegistration = createAvatarRegistration(light);
    const darkRegistration = createAvatarRegistration(dark);

    expect(Object.keys(lightRegistration.recipe.cases)).toHaveLength(6);
    expect(Object.keys(darkRegistration.recipe.cases)).toHaveLength(6);

    const compiledCase = getAvatarRecipeCase(lightRegistration.recipe, { size: 'lg', shape: 'rounded' });
    expect(compiledCase.slots.root.baseVars['--dk-avatar-size']).toBe('56px');
    expect(darkRegistration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
