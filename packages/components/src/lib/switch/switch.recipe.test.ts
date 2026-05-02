import { describe, expect, it } from 'vitest';

import { createSwitchRegistration } from './switch.recipe.js';

describe('switch recipe', () => {
  it('compiles switch proof fixtures including motion checks', () => {
    const registration = createSwitchRegistration();

    expect(Object.keys(registration.recipe.cases)).toHaveLength(3);
    expect(registration.recipe.proofFixtures.every((fixture) => fixture.motion.every((proof) => proof.pass))).toBe(true);
  });
});
