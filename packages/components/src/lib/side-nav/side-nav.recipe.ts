import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { sideNavSpec } from './side-nav.spec.js';

export type SideNavCaseAxes = Record<string, never>;

export const DEFAULT_SIDE_NAV_THEME = DEFAULT_COMPONENT_THEME;

export function createSideNavRegistration(
  theme: ThemeContract = DEFAULT_SIDE_NAV_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: sideNavSpec,
    theme
  });
}

export function getSideNavRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: SideNavCaseAxes = {}
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'SideNav');
}

export function serializeSideNavSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const SIDE_NAV_CASE_KEYS = Object.keys(createSideNavRegistration(DEFAULT_SIDE_NAV_THEME).recipe.cases);
