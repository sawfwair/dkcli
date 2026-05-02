import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { dialogSpec, type DialogSize } from './dialog.spec.js';

export type DialogCaseAxes = {
  size: DialogSize;
};

export const DEFAULT_DIALOG_THEME = DEFAULT_COMPONENT_THEME;

export function createDialogRegistration(theme: ThemeContract = DEFAULT_DIALOG_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: dialogSpec,
    theme
  });
}

export function getDialogRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: DialogCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Dialog');
}

export function serializeDialogSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const DIALOG_CASE_KEYS = Object.keys(createDialogRegistration(DEFAULT_DIALOG_THEME).recipe.cases);
