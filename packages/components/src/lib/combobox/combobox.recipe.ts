import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { comboboxSpec, type ComboboxSize } from './combobox.spec.js';

export type ComboboxCaseAxes = {
  size: ComboboxSize;
};

export const DEFAULT_COMBOBOX_THEME = DEFAULT_COMPONENT_THEME;

export function createComboboxRegistration(
  theme: ThemeContract = DEFAULT_COMBOBOX_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: comboboxSpec,
    theme
  });
}

export function getComboboxRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: ComboboxCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Combobox');
}

export function serializeComboboxSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const COMBOBOX_CASE_KEYS = Object.keys(createComboboxRegistration(DEFAULT_COMBOBOX_THEME).recipe.cases);
