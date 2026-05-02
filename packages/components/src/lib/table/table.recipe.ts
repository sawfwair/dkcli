import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { tableSpec, type TableSize } from './table.spec.js';

export type TableCaseAxes = {
  size: TableSize;
};

export const DEFAULT_TABLE_THEME = DEFAULT_COMPONENT_THEME;

export function createTableRegistration(theme: ThemeContract = DEFAULT_TABLE_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: tableSpec,
    theme
  });
}

export function getTableRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: TableCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Table');
}

export function serializeTableSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TABLE_CASE_KEYS = Object.keys(createTableRegistration(DEFAULT_TABLE_THEME).recipe.cases);
