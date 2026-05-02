import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { accordionSpec, type AccordionSize } from './accordion.spec.js';

export type AccordionCaseAxes = {
  size: AccordionSize;
};

export const DEFAULT_ACCORDION_THEME = DEFAULT_COMPONENT_THEME;

export function createAccordionRegistration(
  theme: ThemeContract = DEFAULT_ACCORDION_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: accordionSpec,
    theme
  });
}

export function getAccordionRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: AccordionCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Accordion');
}

export function serializeAccordionSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const ACCORDION_CASE_KEYS = Object.keys(createAccordionRegistration(DEFAULT_ACCORDION_THEME).recipe.cases);
