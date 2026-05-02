import { describe, expect, it } from 'vitest';

import { createTabsRegistration } from './tabs.recipe.js';

describe('tabs recipe', () => {
  it('compiles tabs cases and proof fixtures', () => {
    const registration = createTabsRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(6);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
  });
});
