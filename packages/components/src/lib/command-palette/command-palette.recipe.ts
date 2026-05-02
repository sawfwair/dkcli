import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { commandPaletteSpec } from './command-palette.spec.js';

export type CommandPaletteCaseAxes = Record<string, never>;

export const DEFAULT_COMMAND_PALETTE_THEME = DEFAULT_COMPONENT_THEME;

export function createCommandPaletteRegistration(
  theme: ThemeContract = DEFAULT_COMMAND_PALETTE_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: commandPaletteSpec,
    theme
  });
}

export function getCommandPaletteRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: CommandPaletteCaseAxes = {}
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'CommandPalette');
}

export function serializeCommandPaletteSlotStyles(
  compiledCase: CompiledComponentCase
): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const COMMAND_PALETTE_CASE_KEYS = Object.keys(
  createCommandPaletteRegistration(DEFAULT_COMMAND_PALETTE_THEME).recipe.cases
);
