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
export type TokenExpr =
  | { ref: string }
  | { scale: 'space' | 'type' | 'radius' | 'elevation'; step: string }
  | { alias: string }
  | { slotVar: { slot: string; name: string } }
  | { onColor: TokenExpr }
  | { mul: [TokenExpr, number] }
  | { literal: string | number };

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

export const COMPONENT_STATE_NAMES = [
  'rest',
  'hover',
  'focus-visible',
  'pressed',
  'checked',
  'indeterminate',
  'disabled',
  'invalid',
  'loading',
  'open',
  'selected'
] as const;

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

const COMPONENT_STATE_NAME_SET = new Set<string>(COMPONENT_STATE_NAMES);
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/** Returns true if the value is a supported component state name. */
export function isComponentStateName(value: unknown): value is ComponentStateName {
  return typeof value === 'string' && COMPONENT_STATE_NAME_SET.has(value);
}

function assertSafeObjectKey(value: string, label: string): void {
  if (!value || UNSAFE_OBJECT_KEYS.has(value)) {
    throw new Error(`Unsafe component spec ${label}: ${value}`);
  }
}

/** Checks safe keys, supported states, distinctness thresholds, and layout dimensions. */
export function validateComponentSpec(spec: ComponentSpec): ComponentSpec {
  assertSafeObjectKey(spec.id, 'id');

  for (const axis of spec.axes) {
    assertSafeObjectKey(axis.name, 'axis name');
    for (const value of axis.values) {
      assertSafeObjectKey(value, `axis value for ${axis.name}`);
    }
  }

  for (const slot of spec.slots) {
    assertSafeObjectKey(slot.name, 'slot name');
  }

  for (const state of spec.states) {
    if (!isComponentStateName(state)) {
      throw new Error(`Unsupported component state: ${String(state)}`);
    }
  }

  for (const [slotName, rules] of Object.entries(spec.recipe)) {
    assertSafeObjectKey(slotName, 'recipe slot name');
    for (const rule of rules) {
      if (rule.match?.axes) {
        for (const [name, value] of Object.entries(rule.match.axes)) {
          assertSafeObjectKey(name, 'recipe axis match name');
          assertSafeObjectKey(value, `recipe axis match value for ${name}`);
        }
      }
      if (rule.match?.states) {
        for (const state of Object.keys(rule.match.states)) {
          if (!isComponentStateName(state)) {
            throw new Error(`Unsupported component state in recipe match: ${state}`);
          }
        }
      }
    }
  }

  for (const proofCase of spec.proofCases ?? []) {
    assertSafeObjectKey(proofCase.name, 'proof case name');
    for (const state of proofCase.states ?? []) {
      if (!isComponentStateName(state)) {
        throw new Error(`Unsupported component state in proof case: ${String(state)}`);
      }
    }
  }

  for (const proof of spec.proofs.distinctness ?? []) {
    if (proof.tokens.length < 2) {
      throw new Error('Distinctness proofs require at least two token references.');
    }
    if (!Number.isFinite(proof.minDeltaE) || proof.minDeltaE < 0) {
      throw new Error('Distinctness proofs require a finite non-negative minDeltaE.');
    }
  }

  const layout = spec.proofs.layout;
  if (layout && (layout.widths.length === 0 || layout.widths.some((width) => !Number.isFinite(width) || width <= 0))) {
    throw new Error('Layout proofs require at least one finite positive width.');
  }
  if (layout?.heights && (layout.heights.length === 0 || layout.heights.some((height) => !Number.isFinite(height) || height <= 0))) {
    throw new Error('Layout proof heights must be finite positive values.');
  }
  if (layout?.textBehavior !== undefined && !['single-line', 'wrap', 'wrap-anywhere', 'scroll'].includes(layout.textBehavior)) {
    throw new Error('Unsupported layout text behavior.');
  }
  if (layout?.lineHeight !== undefined && (!Number.isFinite(layout.lineHeight) || layout.lineHeight <= 0)) {
    throw new Error('Layout line height must be finite and positive.');
  }
  if (layout?.maxLines !== undefined && (!Number.isInteger(layout.maxLines) || layout.maxLines <= 0)) {
    throw new Error('Layout maxLines must be a positive integer.');
  }
  if (typeof layout?.reservedInlineSize === 'number' && (!Number.isFinite(layout.reservedInlineSize) || layout.reservedInlineSize < 0)) {
    throw new Error('Reserved inline size must be finite and non-negative.');
  }

  return spec;
}

/** Validates and returns the supplied component spec. */
export function createComponentSpec(spec: ComponentSpec): ComponentSpec {
  return validateComponentSpec(spec);
}

/** Enumerates every combination of the declared axis values. */
export function enumerateComponentCases(spec: ComponentSpec): ComponentCase[] {
  const axisEntries = spec.axes.map((axis) => [axis.name, axis.values] as const);

  if (axisEntries.length === 0) {
    return [{ componentId: spec.id, axes: {} }];
  }

  const cases: ComponentCase[] = [];

  function walk(index: number, selection: Record<string, string>): void {
    if (index >= axisEntries.length) {
      cases.push({ componentId: spec.id, axes: { ...selection } });
      return;
    }

    const [name, values] = axisEntries[index];
    for (const value of values) {
      selection[name] = value;
      walk(index + 1, selection);
    }
  }

  walk(0, {});
  return cases;
}
