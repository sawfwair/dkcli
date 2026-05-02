import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { segmentedControlSpec, type SegmentedControlSize } from './segmented-control.spec.js';

export type SegmentedControlCaseAxes = {
  size: SegmentedControlSize;
};

export const DEFAULT_SEGMENTED_CONTROL_THEME = DEFAULT_COMPONENT_THEME;

export function createSegmentedControlRegistration(
  theme: ThemeContract = DEFAULT_SEGMENTED_CONTROL_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: segmentedControlSpec,
    theme
  });
}

export function getSegmentedControlRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: SegmentedControlCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'SegmentedControl');
}

export function serializeSegmentedControlSlotStyles(
  compiledCase: CompiledComponentCase
): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const SEGMENTED_CONTROL_CASE_KEYS = Object.keys(
  createSegmentedControlRegistration(DEFAULT_SEGMENTED_CONTROL_THEME).recipe.cases
);
