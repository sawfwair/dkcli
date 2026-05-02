import { describe, expect, it } from 'vitest';

import { createSelectRegistration } from './select.recipe.js';

describe('select recipe', () => {
  it('compiles select proofs for trigger, rows, and surface containment', () => {
    const registration = createSelectRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
