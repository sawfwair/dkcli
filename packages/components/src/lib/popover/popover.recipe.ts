import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { popoverSpec, type PopoverSize } from './popover.spec.js';

export type PopoverCaseAxes = {
  size: PopoverSize;
};

export const DEFAULT_POPOVER_THEME = DEFAULT_COMPONENT_THEME;

export function createPopoverRegistration(theme: ThemeContract = DEFAULT_POPOVER_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: popoverSpec,
    theme
  });
}

export function getPopoverRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: PopoverCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Popover');
}

export function serializePopoverSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const POPOVER_CASE_KEYS = Object.keys(createPopoverRegistration(DEFAULT_POPOVER_THEME).recipe.cases);
