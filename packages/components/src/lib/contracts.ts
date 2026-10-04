import { compileComponentRecipe, type CompiledComponentRecipe, type ComponentSpec, type ThemeContract } from '@dkcli/core';

export type ComponentRecipeArtifact = CompiledComponentRecipe;

/** Associates a component spec and theme with their compiled recipe and proof fixtures. */
export type ComponentRegistration = {
  spec: ComponentSpec;
  theme: ThemeContract;
  recipe: ComponentRecipeArtifact;
};

/** Compiles a component recipe and its mathematical fixtures for the supplied theme. */
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
