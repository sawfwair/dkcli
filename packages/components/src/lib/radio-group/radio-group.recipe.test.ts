import { describe, expect, it } from 'vitest';

import { createRadioGroupRegistration } from './radio-group.recipe.js';

describe('radio group recipe', () => {
  it('compiles radio group cases and option row proofs', () => {
    const registration = createRadioGroupRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(6);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.optionRow.every((proof) => proof.pass))).toBe(true);
  });
});
