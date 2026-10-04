import { type ComponentCase, type ComponentSpec, type ComponentStateName, type TokenExpr } from './component-spec.ts';
import { type DistinctnessReport } from './perception.ts';
import type { ThemeContract } from './theme-contract.ts';
type ResolvedSlotVars = Record<string, string>;
export type CompiledSlotRecipe = {
    baseVars: ResolvedSlotVars;
    stateVars: Partial<Record<ComponentStateName, ResolvedSlotVars>>;
};
export type CompiledComponentCase = {
    caseKey: string;
    axes: Record<string, string>;
    slots: Record<string, CompiledSlotRecipe>;
};
/** Reports an APCA check for resolved colors and font values, without WCAG certification. */
export type ResolvedContrastProof = {
    target: string;
    foreground: string;
    background: string;
    fontSizePx: number;
    fontWeight: number;
    lc: number;
    minLc: number;
    pass: boolean;
};
export type ResolvedTargetProof = {
    target: string;
    modality: 'mouse' | 'touch';
    actualSizePx: number;
    minSizePx: number;
    pass: boolean;
};
/** Reports color differences against the declared base and simulation thresholds. */
export type ResolvedDistinctnessProof = {
    tokens: string[];
    colors: string[];
    requiredMinDeltaE: number;
    cvd: boolean;
    report: DistinctnessReport;
    pass: boolean;
};
/** Reports estimated fit and the authored overflow verdict for one requested width. */
export type ResolvedLayoutWidthCheck = {
    width: number;
    fitsWidth: boolean;
    fitsHeight: boolean;
    pass: boolean;
};
/** Lists declared, evaluated, and unsupported proof categories. */
export type ProofCoverage = {
    declared: string[];
    evaluated: string[];
    unsupported: string[];
    complete: boolean;
};
/** Reports conservative single-line estimates using maximum token values. */
export type ResolvedLayoutCheck = {
    target: string;
    widths: number[];
    heights: number[];
    estimatedInlinePx: number;
    requiredBlockPx: number;
    widthChecks: ResolvedLayoutWidthCheck[];
    assumptions: string[];
    pass: boolean;
};
export type ResolvedHelperTextProof = {
    target: string;
    widths: number[];
    fontSizePx: number;
    lineHeight: number;
    maxLines: number;
    estimatedLines: number[];
    pass: boolean;
};
export type ResolvedOptionRowProof = {
    target: string;
    modality: 'mouse' | 'touch';
    actualSizePx: number;
    minSizePx: number;
    pass: boolean;
};
export type ResolvedAnchoredSurfaceCheck = {
    target: string;
    viewportWidth: number;
    viewportHeight: number;
    surfaceWidthPx: number;
    preferredSurfaceWidthPx: number;
    effectiveSurfaceWidthPx: number;
    surfaceHeightPx: number;
    offsetPx: number;
    viewportPadding: number;
    assumptions: string[];
    pass: boolean;
};
export type ResolvedMotionProof = {
    target: string;
    durationMs: number;
    durationMaxMs: number;
    pass: boolean;
};
/** Contains mathematical proof results for a recipe case, without rendered evidence. */
export type ComponentProofFixture = {
    id: string;
    name: string;
    componentId: string;
    themeName: string;
    caseKey: string;
    axes: Record<string, string>;
    states: ComponentStateName[];
    props: Record<string, boolean | number | string>;
    sampleText?: string;
    slots: Record<string, ResolvedSlotVars>;
    contrast: ResolvedContrastProof[];
    distinctness: ResolvedDistinctnessProof[];
    target: ResolvedTargetProof[];
    layout: ResolvedLayoutCheck[];
    helperText: ResolvedHelperTextProof[];
    optionRow: ResolvedOptionRowProof[];
    anchoredSurface: ResolvedAnchoredSurfaceCheck[];
    motion: ResolvedMotionProof[];
    evidence: 'mathematical';
    coverage: ProofCoverage;
    resolved: boolean;
    pass: boolean;
};
export type CompiledComponentRecipe = {
    componentId: string;
    themeName: string;
    axes: Record<string, string[]>;
    states: ComponentStateName[];
    slots: string[];
    cases: Record<string, CompiledComponentCase>;
    proofFixtures: ComponentProofFixture[];
};
type ResolveContext = {
    activeStates?: ComponentStateName[];
    slotVars?: Record<string, ResolvedSlotVars>;
};
/** Serializes axis values in name order to form a stable recipe case key. */
export declare function componentCaseKey(componentCase: Pick<ComponentCase, 'axes'>): string;
/** Resolves a token expression against a theme and optional slot variables. */
export declare function resolveTokenExpr(theme: ThemeContract, expr: TokenExpr | number, context?: ResolveContext): string | number;
/** Evaluates declared mathematical proofs and reports unsupported categories explicitly. */
export declare function buildComponentProofFixtures(spec: ComponentSpec, compiledRecipe: Omit<CompiledComponentRecipe, 'proofFixtures'>, theme: ThemeContract): ComponentProofFixture[];
/** Adds recorded viewport widths without removing declared mathematical checks. */
export declare function compileProjectComponentFixtures(spec: ComponentSpec, recipe: Omit<CompiledComponentRecipe, 'proofFixtures'>, theme: ThemeContract, viewports: readonly number[]): ComponentProofFixture[];
/** Compiles recipe variables for every axis combination and evaluates mathematical fixtures. */
export declare function compileComponentRecipe(spec: ComponentSpec, theme: ThemeContract): CompiledComponentRecipe;
/** Adds a normalized state suffix to a CSS variable name. */
export declare function serializeStateVarName(name: string, state: ComponentStateName): string;
export {};
