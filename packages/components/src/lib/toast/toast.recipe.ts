import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { toastSpec, type ToastPlacement } from './toast.spec.js';

export type ToastCaseAxes = {
  placement: ToastPlacement;
};

export const DEFAULT_TOAST_THEME = DEFAULT_COMPONENT_THEME;

export function createToastRegistration(theme: ThemeContract = DEFAULT_TOAST_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: toastSpec,
    theme
  });
}

export function getToastRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: ToastCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Toast');
}

export function serializeToastSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TOAST_CASE_KEYS = Object.keys(createToastRegistration(DEFAULT_TOAST_THEME).recipe.cases);
