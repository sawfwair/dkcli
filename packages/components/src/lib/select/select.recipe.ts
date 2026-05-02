import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { selectSpec, type SelectSize } from './select.spec.js';

export type SelectCaseAxes = {
  size: SelectSize;
};

export const DEFAULT_SELECT_THEME = DEFAULT_COMPONENT_THEME;

export function createSelectRegistration(theme: ThemeContract = DEFAULT_SELECT_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: selectSpec,
    theme
  });
}

export function getSelectRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: SelectCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Select');
}

export function serializeSelectSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const SELECT_CASE_KEYS = Object.keys(createSelectRegistration(DEFAULT_SELECT_THEME).recipe.cases);
