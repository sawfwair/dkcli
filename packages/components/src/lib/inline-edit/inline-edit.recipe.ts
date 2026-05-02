import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { inlineEditSpec, type InlineEditSize } from './inline-edit.spec.js';

export type InlineEditCaseAxes = {
  size: InlineEditSize;
};

export const DEFAULT_INLINE_EDIT_THEME = DEFAULT_COMPONENT_THEME;

export function createInlineEditRegistration(
  theme: ThemeContract = DEFAULT_INLINE_EDIT_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: inlineEditSpec,
    theme
  });
}

export function getInlineEditRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: InlineEditCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'InlineEdit');
}

export function serializeInlineEditSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const INLINE_EDIT_CASE_KEYS = Object.keys(
  createInlineEditRegistration(DEFAULT_INLINE_EDIT_THEME).recipe.cases
);
