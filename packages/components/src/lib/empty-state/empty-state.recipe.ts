import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { emptyStateSpec, type EmptyStateSize, type EmptyStateTone } from './empty-state.spec.js';

export type EmptyStateCaseAxes = {
  tone: EmptyStateTone;
  size: EmptyStateSize;
};

export const DEFAULT_EMPTY_STATE_THEME = DEFAULT_COMPONENT_THEME;

export function createEmptyStateRegistration(
  theme: ThemeContract = DEFAULT_EMPTY_STATE_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: emptyStateSpec,
    theme
  });
}

export function getEmptyStateRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: EmptyStateCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'EmptyState');
}

export function serializeEmptyStateSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const EMPTY_STATE_CASE_KEYS = Object.keys(
  createEmptyStateRegistration(DEFAULT_EMPTY_STATE_THEME).recipe.cases
);
