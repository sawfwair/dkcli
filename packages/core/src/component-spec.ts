export type ThemeSeed = {
  color: `#${string}`;
  ratio: string | number;
  mode: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  motion: string;
  contrastProfile?: 'default' | 'low-vision';
};

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

const COMPONENT_STATE_NAME_SET = new Set<string>(COMPONENT_STATE_NAMES);
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function isComponentStateName(value: unknown): value is ComponentStateName {
  return typeof value === 'string' && COMPONENT_STATE_NAME_SET.has(value);
}

function assertSafeObjectKey(value: string, label: string): void {
  if (!value || UNSAFE_OBJECT_KEYS.has(value)) {
    throw new Error(`Unsafe component spec ${label}: ${value}`);
  }
}

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

  return spec;
}

export function createComponentSpec(spec: ComponentSpec): ComponentSpec {
  return validateComponentSpec(spec);
}

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
