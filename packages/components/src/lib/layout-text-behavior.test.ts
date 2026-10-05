import { describe, expect, it } from 'vitest';
import { createProjectTheme } from '@dkcli/tokens';
import { createAccordionRegistration } from './accordion/accordion.recipe.js';
import { createBadgeRegistration } from './badge/badge.recipe.js';
import { createBreadcrumbsRegistration } from './breadcrumbs/breadcrumbs.recipe.js';
import { createButtonRegistration } from './button/button.recipe.js';
import { createCheckboxRegistration } from './checkbox/checkbox.recipe.js';
import { createTextFieldRegistration } from './text-field/text-field.recipe.js';

const theme = createProjectTheme({
  name: 'Northstar',
  seed: { color: '#c44724', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
  fonts: { body: 'system-ui, sans-serif', display: 'Georgia, serif', mono: 'ui-monospace, monospace' }
});

describe('delivered component text behavior in mathematical layout fixtures', () => {
  const cases = [
    { name: 'Accordion panel', registration: createAccordionRegistration, textBehavior: 'wrap-anywhere', lineHeight: 1.6 },
    { name: 'Badge label', registration: createBadgeRegistration, textBehavior: 'wrap-anywhere', lineHeight: 1 },
    { name: 'Breadcrumb item rows', registration: createBreadcrumbsRegistration, textBehavior: 'wrap' },
    { name: 'Button label', registration: createButtonRegistration, textBehavior: 'wrap-anywhere', lineHeight: 1.1 },
    { name: 'Checkbox label', registration: createCheckboxRegistration, textBehavior: 'wrap', lineHeight: 1.35 },
    { name: 'TextField native input', registration: createTextFieldRegistration, textBehavior: 'scroll', lineHeight: 1.2 }
  ];

  it.each(cases)('$name exposes its delivered flow instead of treating all text as a single line', ({ registration, textBehavior, lineHeight }) => {
    const component = registration(theme);
    const layouts = component.recipe.proofFixtures.flatMap((fixture) => fixture.layout);
    expect(layouts.length).toBeGreaterThan(0);
    for (const layout of layouts) {
      expect(layout).toMatchObject({ textBehavior });
      if (lineHeight !== undefined) expect(component.spec.proofs.layout).toMatchObject({ lineHeight });
      expect(layout.estimatedInlinePx).toBeGreaterThan(0);
      expect(layout.widthChecks.map((check) => check.width)).toEqual(layout.widths);
    }
  });

  it.each([createBadgeRegistration, createBreadcrumbsRegistration, createButtonRegistration, createCheckboxRegistration])('does not misclassify a growing min-height control as a fixed-height container', (registration) => {
    expect(registration(theme).spec.proofs.layout).not.toHaveProperty('heights');
  });

  it('binds the Accordion panel sample to the panel typography instead of trigger chrome', () => {
    const layout = createAccordionRegistration(theme).spec.proofs.layout;
    expect(layout).toMatchObject({ target: 'panel', labelFontSize: { slotVar: { slot: 'panel', name: '--dk-accordion-panel-size' } }, heights: [160] });
    expect(layout).not.toHaveProperty('gap');
    expect(layout).not.toHaveProperty('iconSize');
  });

  it('reserves the complete Checkbox control and the delivered Breadcrumb separators', () => {
    expect(createCheckboxRegistration(theme).spec.proofs.layout).toMatchObject({ reservedInlineSize: { literal: 25 } });
    expect(createBreadcrumbsRegistration(theme).spec.proofs.layout).toMatchObject({ reservedInlineSize: { literal: 24 } });
  });
});
