import {
  componentCaseKey,
  serializeStateVarName,
  type CompiledComponentCase,
  type CompiledComponentRecipe,
  type ComponentStateName
} from '@dkcli/core';

function styleString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');
}

export function getCompiledCase(
  recipe: CompiledComponentRecipe,
  axes: Record<string, string>,
  componentLabel: string
): CompiledComponentCase {
  const caseKey = componentCaseKey({ axes });
  const compiledCase = recipe.cases[caseKey];
  if (!compiledCase) {
    throw new Error(`No compiled ${componentLabel} recipe case for "${caseKey}".`);
  }
  return compiledCase;
}

export function serializeCompiledSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
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
