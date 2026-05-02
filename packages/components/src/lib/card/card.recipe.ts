import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { cardSpec, type CardPadding, type CardSurface } from './card.spec.js';

export type CardCaseAxes = {
  padding: CardPadding;
  surface: CardSurface;
};

export const DEFAULT_CARD_THEME = DEFAULT_COMPONENT_THEME;

export function createCardRegistration(theme: ThemeContract = DEFAULT_CARD_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: cardSpec,
    theme
  });
}

export function getCardRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: CardCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Card');
}

export function serializeCardSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const CARD_CASE_KEYS = Object.keys(createCardRegistration(DEFAULT_CARD_THEME).recipe.cases);
