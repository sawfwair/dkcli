import { describe, expect, it } from 'vitest';

import { createMenuRegistration } from './menu.recipe.js';

describe('menu recipe', () => {
  it('compiles menu proofs for rows and anchored surfaces', () => {
    const registration = createMenuRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.optionRow.every((proof) => proof.pass))).toBe(true);
  });
});
