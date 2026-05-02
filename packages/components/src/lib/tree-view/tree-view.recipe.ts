import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { treeViewSpec } from './tree-view.spec.js';

export type TreeViewCaseAxes = Record<string, never>;

export const DEFAULT_TREE_VIEW_THEME = DEFAULT_COMPONENT_THEME;

export function createTreeViewRegistration(
  theme: ThemeContract = DEFAULT_TREE_VIEW_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: treeViewSpec,
    theme
  });
}

export function getTreeViewRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: TreeViewCaseAxes = {}
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'TreeView');
}

export function serializeTreeViewSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const TREE_VIEW_CASE_KEYS = Object.keys(createTreeViewRegistration(DEFAULT_TREE_VIEW_THEME).recipe.cases);
