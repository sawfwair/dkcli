import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { textFieldSpec, type TextFieldSize } from './text-field.spec.js';

export type TextFieldCaseAxes = {
  size: TextFieldSize;
};

export const DEFAULT_TEXT_FIELD_THEME = DEFAULT_COMPONENT_THEME;

export function createTextFieldRegistration(
  theme: ThemeContract = DEFAULT_TEXT_FIELD_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: textFieldSpec,
    theme
  });
}

export function getTextFieldRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: TextFieldCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'TextField');
}

export function serializeTextFieldSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TEXT_FIELD_CASE_KEYS = Object.keys(createTextFieldRegistration(DEFAULT_TEXT_FIELD_THEME).recipe.cases);
