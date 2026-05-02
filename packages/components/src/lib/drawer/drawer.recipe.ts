import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { drawerSpec, type DrawerSide, type DrawerSize } from './drawer.spec.js';

export type DrawerCaseAxes = {
  size: DrawerSize;
  side: DrawerSide;
};

export const DEFAULT_DRAWER_THEME = DEFAULT_COMPONENT_THEME;

export function createDrawerRegistration(
  theme: ThemeContract = DEFAULT_DRAWER_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: drawerSpec,
    theme
  });
}

export function getDrawerRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: DrawerCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Drawer');
}

export function serializeDrawerSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const DRAWER_CASE_KEYS = Object.keys(createDrawerRegistration(DEFAULT_DRAWER_THEME).recipe.cases);
