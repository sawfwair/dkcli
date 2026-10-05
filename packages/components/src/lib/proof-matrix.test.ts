import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { DECLARED_LAYOUT_BEHAVIORS, expectDeclaredLayoutBehavior } from './test-utils/proof-expectations.js';
import { COMPONENT_VERIFICATION_REGISTRY, DK_COMPONENT_THEME_PRESETS } from './verification.js';

const FIXTURE_COUNTS: Record<string, number> = {
  accordion: 2, alert: 5, avatar: 3, badge: 15, breadcrumbs: 1, button: 13, card: 3,
  checkbox: 9, chip: 3, combobox: 9, 'command-palette': 2, 'data-chart': 3,
  'data-grid-lite': 3, 'date-picker': 3, dialog: 3, drawer: 6, 'empty-state': 3,
  'file-upload': 6, 'inline-edit': 1, menu: 6, pagination: 1, popover: 3, progress: 3,
  'radio-group': 12, 'range-date-picker': 3, 'segmented-control': 4, select: 9,
  'side-nav': 2, skeleton: 3, stepper: 3, switch: 6, table: 3, tabs: 12,
  'text-field': 6, textarea: 6, toast: 2, tooltip: 1, 'tree-view': 2
};

describe('component mathematical proof matrix', () => {
  it('keeps explicit fixture-count coverage for every shipped component', () => {
    expect(COMPONENT_VERIFICATION_REGISTRY.map((entry) => entry.slug)).toEqual(Object.keys(FIXTURE_COUNTS));
  });

  for (const themeDef of DK_COMPONENT_THEME_PRESETS) {
    const theme = createTheme(themeDef);
    describe(`theme: ${themeDef.name}`, () => {
      for (const comp of COMPONENT_VERIFICATION_REGISTRY) {
        it(`${comp.name} — preserves all fixtures and declared layout behavior`, () => {
          const registration = comp.createRegistration(theme);
          expectDeclaredLayoutBehavior(
            registration.recipe.proofFixtures,
            FIXTURE_COUNTS[comp.slug],
            DECLARED_LAYOUT_BEHAVIORS[comp.slug]
          );
        });
      }
    });
  }
});
