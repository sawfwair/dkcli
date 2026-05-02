import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { badgeSpec, type BadgeEmphasis, type BadgeSize, type BadgeTone } from './badge.spec.js';

export type BadgeCaseAxes = {
  tone: BadgeTone;
  emphasis: BadgeEmphasis;
  size: BadgeSize;
};

export const DEFAULT_BADGE_THEME = DEFAULT_COMPONENT_THEME;

export function createBadgeRegistration(theme: ThemeContract = DEFAULT_BADGE_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: badgeSpec,
    theme
  });
}

export function getBadgeRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: BadgeCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Badge');
}

export function serializeBadgeSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const BADGE_CASE_KEYS = Object.keys(createBadgeRegistration(DEFAULT_BADGE_THEME).recipe.cases);
