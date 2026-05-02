import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { tooltipSpec } from './tooltip.spec.js';

export type TooltipCaseAxes = Record<string, never>;

export const DEFAULT_TOOLTIP_THEME = DEFAULT_COMPONENT_THEME;

export function createTooltipRegistration(
  theme: ThemeContract = DEFAULT_TOOLTIP_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: tooltipSpec,
    theme
  });
}

export function getTooltipRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: TooltipCaseAxes = {}
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Tooltip');
}

export function serializeTooltipSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TOOLTIP_CASE_KEYS = Object.keys(createTooltipRegistration(DEFAULT_TOOLTIP_THEME).recipe.cases);
