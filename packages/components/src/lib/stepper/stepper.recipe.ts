import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import {
  stepperSpec,
  type StepperOrientation,
  type StepperSize
} from './stepper.spec.js';

export type StepperCaseAxes = {
  size: StepperSize;
  orientation: StepperOrientation;
};

export const DEFAULT_STEPPER_THEME = DEFAULT_COMPONENT_THEME;

export function createStepperRegistration(
  theme: ThemeContract = DEFAULT_STEPPER_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: stepperSpec,
    theme
  });
}

export function getStepperRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: StepperCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'Stepper');
}

export function serializeStepperSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const STEPPER_CASE_KEYS = Object.keys(createStepperRegistration(DEFAULT_STEPPER_THEME).recipe.cases);
