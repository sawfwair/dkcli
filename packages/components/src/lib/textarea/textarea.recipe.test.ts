import { describe, expect, it } from 'vitest';

import { createTextareaRegistration, getTextareaRecipeCase } from './textarea.recipe.js';

describe('textarea recipe', () => {
  it('compiles the textarea cases and proof fixtures', () => {
    const registration = createTextareaRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    const compiledCase = getTextareaRecipeCase(registration.recipe, { size: 'md' });
    expect(compiledCase.slots.field.baseVars['--dk-textarea-bg']).toMatch(/^#/);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
