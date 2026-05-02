import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { skeletonSpec, type SkeletonSize, type SkeletonVariant } from './skeleton.spec.js';

export type SkeletonCaseAxes = {
  variant: SkeletonVariant;
  size: SkeletonSize;
};

export const DEFAULT_SKELETON_THEME = DEFAULT_COMPONENT_THEME;

export function createSkeletonRegistration(
  theme: ThemeContract = DEFAULT_SKELETON_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: skeletonSpec,
    theme
  });
}

export function getSkeletonRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: SkeletonCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Skeleton');
}

export function serializeSkeletonSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const SKELETON_CASE_KEYS = Object.keys(createSkeletonRegistration(DEFAULT_SKELETON_THEME).recipe.cases);
