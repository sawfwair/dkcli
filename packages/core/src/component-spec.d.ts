/** Defines the inputs used to compile a DesignKit theme. */
export type ThemeSeed = {
    color: `#${string}`;
    ratio: string | number;
    mode: 'light' | 'dark';
    density: 'comfortable' | 'compact';
    motion: string;
    contrastProfile?: 'default' | 'low-vision';
};
/** References a theme value, a slot variable, or a literal recipe value. */
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
/** Defines minimum color differences for the base model and optional vision simulations. */
export type DistinctnessProofSpec = {
    tokens: string[];
    minDeltaE: number;
    /** If true, requires the threshold under protan, deutan, and tritan simulations. */
    cvd: boolean;
};
/** Defines conservative layout estimates without measuring rendered elements. */
export type LayoutProofSpec = {
    target: string;
    /** The positive viewport widths in pixels. Each width receives a verdict. */
    widths: number[];
    heights?: number[];
    noOverflow: boolean;
    blockSize?: TokenExpr | number;
    inlinePadding?: TokenExpr | number;
    gap?: TokenExpr | number;
    labelFontSize?: TokenExpr | number;
    iconSize?: TokenExpr | number;
    /** Defaults to a single line. Set only when the rendered text supports this behavior. */
    textBehavior?: 'single-line' | 'wrap' | 'wrap-anywhere' | 'scroll';
    /** Additional persistent chrome, excluding padding. The gap is added once when text is present. */
    reservedInlineSize?: TokenExpr | number;
    /** Unitless text line height. Wrapping estimates default to 1.4. */
    lineHeight?: number;
    /** An explicit line budget; growing controls can omit it. */
    maxLines?: number;
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
    /** Set only when authored CSS caps inline size to viewport width minus this padding. */
    viewportConstrained?: boolean;
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
/** Declares intended semantics and keyboard behavior, without certifying compliance. */
export type AccessibilityContract = {
    role: string;
    keyboardModel?: string;
    labelling?: 'slot-label' | 'aria-label' | 'external-label';
};
/** Selects recipe cases, states, props, and sample text for mathematical checks. */
export type ProofCaseSpec = {
    name: string;
    axes?: Record<string, string>;
    states?: ComponentStateName[];
    props?: Record<string, boolean | number | string>;
    sampleText?: string;
};
/** Defines component slots, recipe variants, proof requirements, and intended semantics. */
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
/** Returns true if the value is a supported component state name. */
export declare function isComponentStateName(value: unknown): value is ComponentStateName;
/** Checks safe keys, supported states, distinctness thresholds, and layout dimensions. */
export declare function validateComponentSpec(spec: ComponentSpec): ComponentSpec;
/** Validates and returns the supplied component spec. */
export declare function createComponentSpec(spec: ComponentSpec): ComponentSpec;
/** Enumerates every combination of the declared axis values. */
export declare function enumerateComponentCases(spec: ComponentSpec): ComponentCase[];
