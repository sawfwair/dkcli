import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { menuSpec, type MenuSize } from './menu.spec.js';

export type MenuCaseAxes = {
  size: MenuSize;
};

export const DEFAULT_MENU_THEME = DEFAULT_COMPONENT_THEME;

export function createMenuRegistration(theme: ThemeContract = DEFAULT_MENU_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: menuSpec,
    theme
  });
}

export function getMenuRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: MenuCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Menu');
}

export function serializeMenuSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const MENU_CASE_KEYS = Object.keys(createMenuRegistration(DEFAULT_MENU_THEME).recipe.cases);
