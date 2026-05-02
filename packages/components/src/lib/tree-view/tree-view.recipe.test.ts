import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createTreeViewRegistration, getTreeViewRecipeCase } from './tree-view.recipe.js';

describe('treeView recipe', () => {
  it('compiles light and dark recipe cases with passing fixtures', () => {
    const light = createTheme({
      name: 'treeView-light',
      seed: {
        color: '#295dff',
        ratio: 'perfect-fourth',
        mode: 'light',
        density: 'comfortable',
        motion: 'snappy'
      }
    });
    const dark = createTheme({
      name: 'treeView-dark',
      seed: {
        color: '#ff6b3d',
        ratio: 'major-third',
        mode: 'dark',
        density: 'compact',
        motion: 'smooth'
      }
    });

    for (const theme of [light, dark]) {
      const registration = createTreeViewRegistration(theme);
      expect(getTreeViewRecipeCase(registration.recipe).caseKey).toBe('');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
