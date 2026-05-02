import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { datePickerSpec, type DatePickerSize } from './date-picker.spec.js';

export type DatePickerCaseAxes = {
  size: DatePickerSize;
};

export const DEFAULT_DATE_PICKER_THEME = DEFAULT_COMPONENT_THEME;

export function createDatePickerRegistration(
  theme: ThemeContract = DEFAULT_DATE_PICKER_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: datePickerSpec,
    theme
  });
}

export function getDatePickerRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: DatePickerCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'DatePicker');
}

export function serializeDatePickerSlotStyles(
  compiledCase: CompiledComponentCase
): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const DATE_PICKER_CASE_KEYS = Object.keys(
  createDatePickerRegistration(DEFAULT_DATE_PICKER_THEME).recipe.cases
);
