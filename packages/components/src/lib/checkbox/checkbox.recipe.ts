import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { checkboxSpec, type CheckboxSize } from './checkbox.spec.js';

export type CheckboxCaseAxes = {
  size: CheckboxSize;
};

export const DEFAULT_CHECKBOX_THEME = DEFAULT_COMPONENT_THEME;

export function createCheckboxRegistration(
  theme: ThemeContract = DEFAULT_CHECKBOX_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: checkboxSpec,
    theme
  });
}

export function getCheckboxRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: CheckboxCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Checkbox');
}

export function serializeCheckboxSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const CHECKBOX_CASE_KEYS = Object.keys(createCheckboxRegistration(DEFAULT_CHECKBOX_THEME).recipe.cases);
