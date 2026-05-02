import { describe, expect, it } from 'vitest';

import { createTheme } from '@dkcli/tokens';

import { createFileUploadRegistration, getFileUploadRecipeCase } from './file-upload.recipe.js';

describe('file-upload recipe', () => {
  it('compiles light and dark file-upload cases with passing fixtures', () => {
    const themes = [
      createTheme({
        name: 'upload-light',
        seed: {
          color: '#295dff',
          ratio: 'perfect-fourth',
          mode: 'light',
          density: 'comfortable',
          motion: 'snappy'
        }
      }),
      createTheme({
        name: 'upload-dark',
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
      const registration = createFileUploadRegistration(theme);
      expect(getFileUploadRecipeCase(registration.recipe, { size: 'md' }).caseKey).toContain('size=md');
      expect(registration.recipe.proofFixtures.every((fixture) => fixture.pass)).toBe(true);
    }
  });
});
