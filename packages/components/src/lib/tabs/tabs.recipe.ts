import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { tabsSpec, type TabsOrientation, type TabsSize } from './tabs.spec.js';

export type TabsCaseAxes = {
  size: TabsSize;
  orientation: TabsOrientation;
};

export const DEFAULT_TABS_THEME = DEFAULT_COMPONENT_THEME;

export function createTabsRegistration(theme: ThemeContract = DEFAULT_TABS_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: tabsSpec,
    theme
  });
}

export function getTabsRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: TabsCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Tabs');
}

export function serializeTabsSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TABS_CASE_KEYS = Object.keys(createTabsRegistration(DEFAULT_TABS_THEME).recipe.cases);
