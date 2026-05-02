import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { chipSpec, type ChipSize, type ChipTone } from './chip.spec.js';

export type ChipCaseAxes = {
  tone: ChipTone;
  size: ChipSize;
};

export const DEFAULT_CHIP_THEME = DEFAULT_COMPONENT_THEME;

export function createChipRegistration(theme: ThemeContract = DEFAULT_CHIP_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: chipSpec,
    theme
  });
}

export function getChipRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: ChipCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Chip');
}

export function serializeChipSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const CHIP_CASE_KEYS = Object.keys(createChipRegistration(DEFAULT_CHIP_THEME).recipe.cases);
