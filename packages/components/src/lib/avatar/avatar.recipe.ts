import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { avatarSpec, type AvatarShape, type AvatarSize } from './avatar.spec.js';

export type AvatarCaseAxes = {
  size: AvatarSize;
  shape: AvatarShape;
};

export const DEFAULT_AVATAR_THEME = DEFAULT_COMPONENT_THEME;

export function createAvatarRegistration(theme: ThemeContract = DEFAULT_AVATAR_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: avatarSpec,
    theme
  });
}

export function getAvatarRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: AvatarCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Avatar');
}

export function serializeAvatarSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const AVATAR_CASE_KEYS = Object.keys(createAvatarRegistration(DEFAULT_AVATAR_THEME).recipe.cases);
