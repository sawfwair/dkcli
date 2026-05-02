import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { radioGroupSpec, type RadioGroupOrientation, type RadioGroupSize } from './radio-group.spec.js';

export type RadioGroupCaseAxes = {
  size: RadioGroupSize;
  orientation: RadioGroupOrientation;
};

export const DEFAULT_RADIO_GROUP_THEME = DEFAULT_COMPONENT_THEME;

export function createRadioGroupRegistration(
  theme: ThemeContract = DEFAULT_RADIO_GROUP_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: radioGroupSpec,
    theme
  });
}

export function getRadioGroupRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: RadioGroupCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'RadioGroup');
}

export function serializeRadioGroupSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const RADIO_GROUP_CASE_KEYS = Object.keys(
  createRadioGroupRegistration(DEFAULT_RADIO_GROUP_THEME).recipe.cases
);
