export * from './color.ts';
export type {
  AccessibilityContract,
  AnchoredSurfaceProofSpec,
  AxisSpec,
  ComponentCase,
  ComponentProofs,
  ComponentSpec,
  ComponentStateName,
  ContrastProofSpec,
  DistinctnessProofSpec,
  HelperTextProofSpec,
  LayoutProofSpec,
  MotionProofSpec,
  OptionRowProofSpec,
  ProofCaseSpec,
  RecipeMatch,
  RecipeRule,
  SlotSpec,
  TargetProofSpec,
  ThemeSeed,
  TokenExpr
} from './component-spec.ts';
export { createComponentSpec, enumerateComponentCases } from './component-spec.ts';
export type {
  CompiledComponentCase,
  CompiledComponentRecipe,
  CompiledSlotRecipe,
  ComponentProofFixture,
  ResolvedAnchoredSurfaceCheck,
  ResolvedContrastProof,
  ResolvedHelperTextProof,
  ResolvedLayoutCheck,
  ResolvedMotionProof,
  ResolvedOptionRowProof,
  ResolvedTargetProof
} from './component-compiler.ts';
export {
  buildComponentProofFixtures,
  compileComponentRecipe,
  componentCaseKey,
  resolveTokenExpr,
  serializeStateVarName
} from './component-compiler.ts';
export * from './compose.ts';
export * from './css-safety.ts';
export * from './design.ts';
export * from './interaction.ts';
export * from './layout.ts';
export * from './audit.ts';
export * from './saliency.ts';
export * from './palette.ts';
export * from './perception.ts';
export * from './scale.ts';
export type { ThemeContract, ThemeFamily, ThemeTokenValue } from './theme-contract.ts';
export * from './types.ts';
