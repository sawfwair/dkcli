import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { alertSpec, type AlertTone } from './alert.spec.js';

export type AlertCaseAxes = {
  tone: AlertTone;
};

export const DEFAULT_ALERT_THEME = DEFAULT_COMPONENT_THEME;

export function createAlertRegistration(theme: ThemeContract = DEFAULT_ALERT_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: alertSpec,
    theme
  });
}

export function getAlertRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: AlertCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Alert');
}

export function serializeAlertSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const ALERT_CASE_KEYS = Object.keys(createAlertRegistration(DEFAULT_ALERT_THEME).recipe.cases);
