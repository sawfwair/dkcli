import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { switchSpec, type SwitchSize } from './switch.spec.js';

export type SwitchCaseAxes = {
  size: SwitchSize;
};

export const DEFAULT_SWITCH_THEME = DEFAULT_COMPONENT_THEME;

export function createSwitchRegistration(theme: ThemeContract = DEFAULT_SWITCH_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: switchSpec,
    theme
  });
}

export function getSwitchRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: SwitchCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Switch');
}

export function serializeSwitchSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const SWITCH_CASE_KEYS = Object.keys(createSwitchRegistration(DEFAULT_SWITCH_THEME).recipe.cases);
