import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createButtonRegistration, getButtonRecipeCase } from './button.recipe.js';

describe('button recipe', () => {
  it('compiles the full button case matrix for light and dark themes', () => {
    const light = createTheme({
      name: 'button-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'button-dark',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'dark',
        density: 'comfortable',
        motion: 'snappy'
      }
    });

    const lightRegistration = createButtonRegistration(light);
    const darkRegistration = createButtonRegistration(dark);

    expect(Object.keys(lightRegistration.recipe.cases)).toHaveLength(120);
    expect(Object.keys(darkRegistration.recipe.cases)).toHaveLength(120);

    const lightCase = getButtonRecipeCase(lightRegistration.recipe, {
      variant: 'solid',
      size: 'md',
      content: 'label'
    });
    const darkCase = getButtonRecipeCase(darkRegistration.recipe, {
      variant: 'link',
      size: 'lg',
      content: 'leading-trailing'
    });

    expect(lightCase.slots.root.baseVars['--dk-button-bg']).toMatch(/^#/);
    expect(lightCase.slots.label.baseVars['--dk-button-label-font-size']).toContain('clamp');
    expect(darkCase.slots.root.baseVars['--dk-button-fg']).toMatch(/^#/);
    expect(darkCase.slots.root.stateVars.hover?.['--dk-button-bg']).toMatch(/^#/);
  });

  it('generates curated proof fixtures that all pass', () => {
    const registration = createButtonRegistration();

    expect(registration.recipe.proofFixtures.length).toBeGreaterThan(0);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.resolved)).toBe(true);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    expect(registration.recipe.proofFixtures.some((fixture) => fixture.props.as === 'a')).toBe(true);
    expect(registration.recipe.proofFixtures.some((fixture) => fixture.states.includes('loading'))).toBe(true);
  });
});
