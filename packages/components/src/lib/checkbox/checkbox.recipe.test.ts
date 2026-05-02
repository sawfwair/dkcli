import { describe, expect, it } from 'vitest';

import { createCheckboxRegistration, getCheckboxRecipeCase } from './checkbox.recipe.js';

describe('checkbox recipe', () => {
  it('compiles checkbox cases and proof fixtures', () => {
    const registration = createCheckboxRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    const compiledCase = getCheckboxRecipeCase(registration.recipe, { size: 'md' });
    expect(compiledCase.slots.control.baseVars['--dk-checkbox-bg']).toMatch(/^#/);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
