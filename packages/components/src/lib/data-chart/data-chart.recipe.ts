import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { dataChartSpec, type DataChartType } from './data-chart.spec.js';

export type DataChartCaseAxes = {
  type: DataChartType;
};

export const DEFAULT_DATA_CHART_THEME = DEFAULT_COMPONENT_THEME;

export function createDataChartRegistration(
  theme: ThemeContract = DEFAULT_DATA_CHART_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: dataChartSpec,
    theme
  });
}

export function getDataChartRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: DataChartCaseAxes = { type: 'line' }
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'DataChart');
}

export function serializeDataChartSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const DATA_CHART_CASE_KEYS = Object.keys(createDataChartRegistration(DEFAULT_DATA_CHART_THEME).recipe.cases);
