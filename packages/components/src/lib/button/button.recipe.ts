import {
  componentCaseKey,
  serializeStateVarName,
  type CompiledComponentCase,
  type CompiledComponentRecipe,
  type ComponentStateName,
  type ThemeContract
} from '@dkcli/core';
import { createTheme } from '@dkcli/tokens';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { buttonSpec, type ButtonContentMode, type ButtonSize, type ButtonVariant } from './button.spec.js';

export type ButtonCaseAxes = {
  content: ButtonContentMode;
  size: ButtonSize;
  variant: ButtonVariant;
};

export const DEFAULT_BUTTON_THEME = createTheme({
  name: 'dk-button-default',
  seed: {
    color: '#295dff',
    ratio: 'perfect-fourth',
    mode: 'light',
    density: 'comfortable',
    motion: 'snappy'
  }
});

function styleString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');
}

export function createButtonRegistration(theme: ThemeContract = DEFAULT_BUTTON_THEME): ComponentRegistration {
  return createComponentRegistration({
    spec: buttonSpec,
    theme
  });
}

export function getButtonRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: ButtonCaseAxes
): CompiledComponentCase {
  const caseKey = componentCaseKey({ axes });
  const compiledCase = recipe.cases[caseKey];
  if (!compiledCase) {
    throw new Error(`No compiled Button recipe case for "${caseKey}".`);
  }
  return compiledCase;
}

export function serializeButtonSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return Object.fromEntries(
    Object.entries(compiledCase.slots).map(([slotName, slotRecipe]) => {
      const vars = { ...slotRecipe.baseVars };
      for (const [state, stateVars] of Object.entries(slotRecipe.stateVars)) {
        if (!stateVars) {
          continue;
        }
        for (const [name, value] of Object.entries(stateVars)) {
          vars[serializeStateVarName(name, state as ComponentStateName)] = value;
        }
      }
      return [slotName, styleString(vars)];
    })
  );
}

export const BUTTON_CASE_KEYS = Object.keys(createButtonRegistration(DEFAULT_BUTTON_THEME).recipe.cases);
