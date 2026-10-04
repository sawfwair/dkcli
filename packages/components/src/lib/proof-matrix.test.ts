import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import {
  BADGE_LAYOUT_FAILURES,
  BUTTON_LAYOUT_FAILURES,
  CHECKBOX_LAYOUT_FAILURES,
  expectKnownLayoutFailures,
  type KnownLayoutFailure
} from './test-utils/proof-expectations.js';
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

// These single-line width estimates are known limits of the current recipes.
// Keep failures visible until rendered evidence or an intentional recipe change resolves them.
function expectedLayoutFailures(slug: string, themeId: string): KnownLayoutFailure[] {
  switch (slug) {
    case 'accordion': return [{ name: 'accordion-md-open', widths: [320] }];
    case 'breadcrumbs': return [{ name: 'breadcrumbs-md', widths: [220] }];
    case 'button': return themeId === 'linen' ? [BUTTON_LAYOUT_FAILURES[1]] : BUTTON_LAYOUT_FAILURES;
    case 'badge': return themeId === 'sage' ? [] : BADGE_LAYOUT_FAILURES;
    case 'checkbox': return ['cobalt', 'ember'].includes(themeId) ? CHECKBOX_LAYOUT_FAILURES : [];
    case 'text-field': return themeId === 'linen' ? [] : [{ name: 'sizes (size=lg)', widths: [240] }];
    default: return [];
  }
}

describe('component mathematical proof matrix', () => {
  it('keeps explicit fixture-count coverage for every shipped component', () => {
    expect(COMPONENT_VERIFICATION_REGISTRY.map((entry) => entry.slug)).toEqual(Object.keys(FIXTURE_COUNTS));
  });

  for (const themeDef of DK_COMPONENT_THEME_PRESETS) {
    const theme = createTheme(themeDef);
    describe(`theme: ${themeDef.name}`, () => {
      for (const comp of COMPONENT_VERIFICATION_REGISTRY) {
        it(`${comp.name} — preserves all fixtures and reports known narrow-width failures`, () => {
          const registration = comp.createRegistration(theme);
          expectKnownLayoutFailures(
            registration.recipe.proofFixtures,
            FIXTURE_COUNTS[comp.slug],
            expectedLayoutFailures(comp.slug, themeDef.id)
          );
        });
      }
    });
  }
});
