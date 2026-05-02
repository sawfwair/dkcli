import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { breadcrumbsSpec, type BreadcrumbsSize } from './breadcrumbs.spec.js';

export type BreadcrumbsCaseAxes = {
  size: BreadcrumbsSize;
};

export const DEFAULT_BREADCRUMBS_THEME = DEFAULT_COMPONENT_THEME;

export function createBreadcrumbsRegistration(
  theme: ThemeContract = DEFAULT_BREADCRUMBS_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: breadcrumbsSpec,
    theme
  });
}

export function getBreadcrumbsRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: BreadcrumbsCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Breadcrumbs');
}

export function serializeBreadcrumbsSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const BREADCRUMBS_CASE_KEYS = Object.keys(
  createBreadcrumbsRegistration(DEFAULT_BREADCRUMBS_THEME).recipe.cases
);
