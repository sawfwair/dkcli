import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { paginationSpec, type PaginationSize } from './pagination.spec.js';

export type PaginationCaseAxes = {
  size: PaginationSize;
};

export const DEFAULT_PAGINATION_THEME = DEFAULT_COMPONENT_THEME;

export function createPaginationRegistration(
  theme: ThemeContract = DEFAULT_PAGINATION_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: paginationSpec,
    theme
  });
}

export function getPaginationRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: PaginationCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Pagination');
}

export function serializePaginationSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const PAGINATION_CASE_KEYS = Object.keys(
  createPaginationRegistration(DEFAULT_PAGINATION_THEME).recipe.cases
);
