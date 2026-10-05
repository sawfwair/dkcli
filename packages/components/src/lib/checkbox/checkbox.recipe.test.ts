import { describe, expect, it } from 'vitest';

import { createCheckboxRegistration, getCheckboxRecipeCase } from './checkbox.recipe.js';
import { DECLARED_LAYOUT_BEHAVIORS, expectDeclaredLayoutBehavior } from '../test-utils/proof-expectations.js';

describe('checkbox recipe', () => {
  it('compiles checkbox cases and proof fixtures', () => {
    const registration = createCheckboxRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    const compiledCase = getCheckboxRecipeCase(registration.recipe, { size: 'md' });
    expect(compiledCase.slots.control.baseVars['--dk-checkbox-bg']).toMatch(/^#/);
    expectDeclaredLayoutBehavior(registration.recipe.proofFixtures, 9, DECLARED_LAYOUT_BEHAVIORS.checkbox);
  });
});
