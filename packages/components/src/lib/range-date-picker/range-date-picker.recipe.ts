import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { rangeDatePickerSpec, type RangeDatePickerSize } from './range-date-picker.spec.js';

export type RangeDatePickerCaseAxes = {
  size: RangeDatePickerSize;
};

export const DEFAULT_RANGE_DATE_PICKER_THEME = DEFAULT_COMPONENT_THEME;

export function createRangeDatePickerRegistration(
  theme: ThemeContract = DEFAULT_RANGE_DATE_PICKER_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: rangeDatePickerSpec,
    theme
  });
}

export function getRangeDatePickerRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: RangeDatePickerCaseAxes = { size: 'md' }
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'RangeDatePicker');
}

export function serializeRangeDatePickerSlotStyles(
  compiledCase: CompiledComponentCase
): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const RANGE_DATE_PICKER_CASE_KEYS = Object.keys(
  createRangeDatePickerRegistration(DEFAULT_RANGE_DATE_PICKER_THEME).recipe.cases
);
