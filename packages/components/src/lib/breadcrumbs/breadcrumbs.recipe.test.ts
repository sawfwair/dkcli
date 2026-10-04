import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createBreadcrumbsRegistration, getBreadcrumbsRecipeCase } from './breadcrumbs.recipe.js';
import { expectKnownLayoutFailures } from '../test-utils/proof-expectations.js';

describe('breadcrumbs recipe', () => {
  it('compiles light and dark breadcrumb cases and reports the known narrow-width estimate', () => {
    const themes = [
      createTheme({
        name: 'breadcrumbs-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'breadcrumbs-dark',
        seed: {
          color: '#1f8a70',
          ratio: 'major-third',
          mode: 'dark',
          density: 'compact',
          motion: 'smooth'
        }
      })
    ];

    for (const theme of themes) {
      const registration = createBreadcrumbsRegistration(theme);
      expect(getBreadcrumbsRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain('size=md');
      expectKnownLayoutFailures(registration.recipe.proofFixtures, 1, [{ name: 'breadcrumbs-md', widths: [220] }]);
    }
  });
});
