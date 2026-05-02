import { compileComponentRecipe, type CompiledComponentRecipe, type ComponentSpec, type ThemeContract } from '@dkcli/core';

export type ComponentRecipeArtifact = CompiledComponentRecipe;

export type ComponentRegistration = {
  spec: ComponentSpec;
  theme: ThemeContract;
  recipe: ComponentRecipeArtifact;
};

export function createComponentRegistration(input: {
  spec: ComponentSpec;
  theme: ThemeContract;
}): ComponentRegistration {
  return {
    spec: input.spec,
    theme: input.theme,
    recipe: compileComponentRecipe(input.spec, input.theme)
  };
}
