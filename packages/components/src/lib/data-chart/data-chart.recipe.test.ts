import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createDataChartRegistration, getDataChartRecipeCase } from './data-chart.recipe.js';

describe('data chart recipe', () => {
  it('compiles light and dark data-chart cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'chart-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'chart-dark',
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
      const registration = createDataChartRegistration(theme);
      expect(getDataChartRecipeCase(registration.recipe, { type: 'line' }).caseKey).toContain('type=line');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
