import { type ComponentCase, type ComponentSpec, type ComponentStateName, type TokenExpr } from './component-spec.ts';
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
export type ResolvedLayoutCheck = {
    target: string;
    widths: number[];
    heights: number[];
    estimatedInlinePx: number;
    requiredBlockPx: number;
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
    surfaceHeightPx: number;
    offsetPx: number;
    viewportPadding: number;
    pass: boolean;
};
export type ResolvedMotionProof = {
    target: string;
    durationMs: number;
    durationMaxMs: number;
    pass: boolean;
};
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
    target: ResolvedTargetProof[];
    layout: ResolvedLayoutCheck[];
    helperText: ResolvedHelperTextProof[];
    optionRow: ResolvedOptionRowProof[];
    anchoredSurface: ResolvedAnchoredSurfaceCheck[];
    motion: ResolvedMotionProof[];
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
export declare function componentCaseKey(componentCase: Pick<ComponentCase, 'axes'>): string;
export declare function resolveTokenExpr(theme: ThemeContract, expr: TokenExpr | number, context?: ResolveContext): string | number;
export declare function buildComponentProofFixtures(spec: ComponentSpec, compiledRecipe: Omit<CompiledComponentRecipe, 'proofFixtures'>, theme: ThemeContract): ComponentProofFixture[];
export declare function compileComponentRecipe(spec: ComponentSpec, theme: ThemeContract): CompiledComponentRecipe;
export declare function serializeStateVarName(name: string, state: ComponentStateName): string;
export {};
