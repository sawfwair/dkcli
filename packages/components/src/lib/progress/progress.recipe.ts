import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { progressSpec, type ProgressSize, type ProgressTone } from './progress.spec.js';

export type ProgressCaseAxes = {
  tone: ProgressTone;
  size: ProgressSize;
};

export const DEFAULT_PROGRESS_THEME = DEFAULT_COMPONENT_THEME;

export function createProgressRegistration(
  theme: ThemeContract = DEFAULT_PROGRESS_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: progressSpec,
    theme
  });
}

export function getProgressRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: ProgressCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Progress');
}

export function serializeProgressSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const PROGRESS_CASE_KEYS = Object.keys(createProgressRegistration(DEFAULT_PROGRESS_THEME).recipe.cases);
