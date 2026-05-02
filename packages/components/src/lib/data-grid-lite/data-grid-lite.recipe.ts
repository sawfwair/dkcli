import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { dataGridLiteSpec, type DataGridLiteSize } from './data-grid-lite.spec.js';

export type DataGridLiteCaseAxes = {
  size: DataGridLiteSize;
};

export const DEFAULT_DATA_GRID_LITE_THEME = DEFAULT_COMPONENT_THEME;

export function createDataGridLiteRegistration(
  theme: ThemeContract = DEFAULT_DATA_GRID_LITE_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: dataGridLiteSpec,
    theme
  });
}

export function getDataGridLiteRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: DataGridLiteCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'DataGridLite');
}

export function serializeDataGridLiteSlotStyles(
  compiledCase: CompiledComponentCase
): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const DATA_GRID_LITE_CASE_KEYS = Object.keys(
  createDataGridLiteRegistration(DEFAULT_DATA_GRID_LITE_THEME).recipe.cases
);
