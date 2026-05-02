import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { textareaSpec, type TextareaSize } from './textarea.spec.js';

export type TextareaCaseAxes = {
  size: TextareaSize;
};

export const DEFAULT_TEXTAREA_THEME = DEFAULT_COMPONENT_THEME;

export function createTextareaRegistration(
  theme: ThemeContract = DEFAULT_TEXTAREA_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: textareaSpec,
    theme
  });
}

export function getTextareaRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: TextareaCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Textarea');
}

export function serializeTextareaSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TEXTAREA_CASE_KEYS = Object.keys(createTextareaRegistration(DEFAULT_TEXTAREA_THEME).recipe.cases);
