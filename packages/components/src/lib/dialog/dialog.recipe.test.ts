import { describe, expect, it } from 'vitest';

import { createDialogRegistration } from './dialog.recipe.js';

describe('dialog recipe', () => {
  it('compiles dialog cases and proof fixtures', () => {
    const registration = createDialogRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
