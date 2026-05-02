import { describe, expect, it } from 'vitest';

import { createPopoverRegistration } from './popover.recipe.js';

describe('popover recipe', () => {
  it('compiles popover anchored-surface fixtures', () => {
    const registration = createPopoverRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.anchoredSurface.every((proof) => proof.pass))).toBe(true);
  });
});
