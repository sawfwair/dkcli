export type ThemeSeed = {
    color: `#${string}`;
    ratio: string | number;
    mode: 'light' | 'dark';
    density: 'comfortable' | 'compact';
    motion: string;
    contrastProfile?: 'default' | 'low-vision';
};
export type TokenExpr = {
    ref: string;
} | {
    scale: 'space' | 'type' | 'radius' | 'elevation';
    step: string;
} | {
    alias: string;
} | {
    slotVar: {
        slot: string;
        name: string;
    };
} | {
    onColor: TokenExpr;
} | {
    mul: [TokenExpr, number];
} | {
    literal: string | number;
};
export type SlotSpec = {
    name: string;
    kind: 'container' | 'text' | 'icon' | 'control';
    role?: 'title' | 'body' | 'cta' | 'support' | 'meta';
    required?: boolean;
};
export type AxisSpec = {
    name: string;
    values: string[];
    default: string;
};
export declare const COMPONENT_STATE_NAMES: readonly ["rest", "hover", "focus-visible", "pressed", "checked", "indeterminate", "disabled", "invalid", "loading", "open", "selected"];
export type ComponentStateName = (typeof COMPONENT_STATE_NAMES)[number];
export type RecipeMatch = {
    axes?: Record<string, string>;
    states?: Partial<Record<ComponentStateName, boolean>>;
};
export type RecipeRule = {
    match?: RecipeMatch;
    style: Record<string, TokenExpr>;
};
export type ContrastProofSpec = {
    target: string;
    foreground: TokenExpr;
    background: TokenExpr;
    fontSize: TokenExpr | number;
    fontWeight: number;
    minLc?: number;
};
export type TargetProofSpec = {
    target: string;
    minSize: TokenExpr | number;
    actualSize?: TokenExpr | number;
    modality: 'mouse' | 'touch';
};
export type DistinctnessProofSpec = {
    tokens: string[];
    minDeltaE: number;
    cvd: boolean;
};
export type LayoutProofSpec = {
    target: string;
    widths: number[];
    heights?: number[];
    noOverflow: boolean;
    blockSize?: TokenExpr | number;
    inlinePadding?: TokenExpr | number;
    gap?: TokenExpr | number;
    labelFontSize?: TokenExpr | number;
    iconSize?: TokenExpr | number;
};
export type MotionProofSpec = {
    target: string;
    durationMaxMs: number;
};
export type HelperTextProofSpec = {
    target: string;
    widths: number[];
    fontSize: TokenExpr | number;
    maxLines: number;
    lineHeight?: number;
    sampleText?: string;
};
export type OptionRowProofSpec = {
    target: string;
    minSize: TokenExpr | number;
    actualSize: TokenExpr | number;
    modality: 'mouse' | 'touch';
};
export type AnchoredSurfaceProofSpec = {
    target: string;
    viewportWidth: number;
    viewportHeight: number;
    surfaceWidth: TokenExpr | number;
    surfaceHeight: TokenExpr | number;
    offset: TokenExpr | number;
    viewportPadding: number;
};
export type ComponentProofs = {
    contrast?: ContrastProofSpec[];
    target?: TargetProofSpec[];
    distinctness?: DistinctnessProofSpec[];
    layout?: LayoutProofSpec;
    motion?: MotionProofSpec[];
    helperText?: HelperTextProofSpec[];
    optionRow?: OptionRowProofSpec[];
    anchoredSurface?: AnchoredSurfaceProofSpec[];
};
export type AccessibilityContract = {
    role: string;
    keyboardModel?: string;
    labelling?: 'slot-label' | 'aria-label' | 'external-label';
};
export type ProofCaseSpec = {
    name: string;
    axes?: Record<string, string>;
    states?: ComponentStateName[];
    props?: Record<string, boolean | number | string>;
    sampleText?: string;
};
export type ComponentSpec = {
    id: string;
    slots: SlotSpec[];
    axes: AxisSpec[];
    states: ComponentStateName[];
    recipe: Record<string, RecipeRule[]>;
    proofs: ComponentProofs;
    proofCases?: ProofCaseSpec[];
    a11y: AccessibilityContract;
};
export type ComponentCase = {
    componentId: string;
    axes: Record<string, string>;
};
export declare function isComponentStateName(value: unknown): value is ComponentStateName;
export declare function validateComponentSpec(spec: ComponentSpec): ComponentSpec;
export declare function createComponentSpec(spec: ComponentSpec): ComponentSpec;
export declare function enumerateComponentCases(spec: ComponentSpec): ComponentCase[];
