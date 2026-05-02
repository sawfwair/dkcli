import { apcaCheck, apcaContrast, autoContrastAPCA } from './color.ts';
import {
  type AnchoredSurfaceProofSpec,
  enumerateComponentCases,
  type ComponentCase,
  type ComponentProofs,
  type ComponentSpec,
  type ComponentStateName,
  type HelperTextProofSpec,
  type LayoutProofSpec,
  type OptionRowProofSpec,
  type ProofCaseSpec,
  type RecipeMatch,
  type TokenExpr
} from './component-spec.ts';
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

function canonicalStateName(state: ComponentStateName): string {
  return state.replace(/[^a-z0-9]+/gi, '-');
}

export function componentCaseKey(componentCase: Pick<ComponentCase, 'axes'>): string {
  return Object.entries(componentCase.axes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join('|');
}

function parseNumberish(value: number | string): { numeric: number; unit: string } | null {
  if (typeof value === 'number') {
    return { numeric: value, unit: '' };
  }

  const trimmed = value.trim();
  const clampMatch = trimmed.match(/^clamp\(\s*([-.\d]+)(rem|px|em)\s*,.+,\s*([-.\d]+)(rem|px|em)\s*\)$/i);
  if (clampMatch) {
    return toPx({ numeric: Number(clampMatch[3]), unit: clampMatch[4] });
  }

  const match = trimmed.match(/^(-?\d*\.?\d+)(px|rem|em|ms)?$/i);
  if (!match) {
    return null;
  }

  return { numeric: Number(match[1]), unit: match[2] ?? '' };
}

function toPx(value: { numeric: number; unit: string }): { numeric: number; unit: 'px' } {
  switch (value.unit) {
    case 'rem':
    case 'em':
      return { numeric: value.numeric * 16, unit: 'px' };
    case 'px':
    case '':
      return { numeric: value.numeric, unit: 'px' };
    default:
      return { numeric: value.numeric, unit: 'px' };
  }
}

function multiplyNumberish(value: string | number, factor: number): string | number {
  const parsed = parseNumberish(value);
  if (!parsed) {
    throw new Error(`Cannot multiply unresolved token "${String(value)}".`);
  }

  const multiplied = parsed.numeric * factor;
  return parsed.unit ? `${Number(multiplied.toFixed(3))}${parsed.unit}` : Number(multiplied.toFixed(3));
}

function resolveAlias(theme: ThemeContract, alias: string, seen: Set<string>): string | number {
  if (seen.has(alias)) {
    throw new Error(`Circular theme alias detected for "${alias}".`);
  }

  const resolved = theme.aliases[alias];
  if (!resolved) {
    throw new Error(`Unknown theme alias "${alias}".`);
  }

  seen.add(alias);
  return resolveThemeToken(theme, resolved, seen);
}

function resolveThemeToken(theme: ThemeContract, ref: string, seen: Set<string> = new Set()): string | number {
  if (!ref.includes('.')) {
    return resolveAlias(theme, ref, seen);
  }

  const [familyName, tokenName] = ref.split('.', 2) as [keyof ThemeContract['families'], string];
  const family = theme.families[familyName];
  if (!family) {
    throw new Error(`Unknown theme family "${familyName}" in token ref "${ref}".`);
  }

  if (!(tokenName in family)) {
    throw new Error(`Unknown theme token "${ref}".`);
  }

  return family[tokenName]!;
}

function mergeVars(target: ResolvedSlotVars, source: ResolvedSlotVars): void {
  for (const [name, value] of Object.entries(source)) {
    target[name] = value;
  }
}

function matchesAxes(match: RecipeMatch | undefined, axes: Record<string, string>): boolean {
  if (!match?.axes) {
    return true;
  }

  return Object.entries(match.axes).every(([name, value]) => axes[name] === value);
}

function matchedStates(match: RecipeMatch | undefined, states: ComponentStateName[]): ComponentStateName[] {
  if (!match?.states) {
    return [];
  }

  return states.filter((state) => match.states?.[state] === true);
}

function resolveSlotVars(
  compiledCase: CompiledComponentCase,
  activeStates: ComponentStateName[]
): Record<string, ResolvedSlotVars> {
  return Object.fromEntries(
    Object.entries(compiledCase.slots).map(([slotName, slotRecipe]) => {
      const slotVars = { ...slotRecipe.baseVars };
      for (const state of activeStates) {
        mergeVars(slotVars, slotRecipe.stateVars[state] ?? {});
      }
      return [slotName, slotVars];
    })
  );
}

function resolveExprToString(
  theme: ThemeContract,
  expr: TokenExpr | number,
  context: ResolveContext = {}
): string {
  const resolved = resolveTokenExpr(theme, expr, context);
  return typeof resolved === 'number' ? String(resolved) : resolved;
}

function resolveExprToPx(theme: ThemeContract, expr: TokenExpr | number, context: ResolveContext = {}): number {
  const resolved = resolveTokenExpr(theme, expr, context);
  const parsed = parseNumberish(resolved);
  if (!parsed) {
    throw new Error(`Token "${JSON.stringify(expr)}" did not resolve to a numeric length.`);
  }
  return Number(toPx(parsed).numeric.toFixed(2));
}

function resolveExprToMs(theme: ThemeContract, expr: TokenExpr | number, context: ResolveContext = {}): number {
  const resolved = resolveTokenExpr(theme, expr, context);
  const parsed = parseNumberish(resolved);
  if (!parsed) {
    throw new Error(`Token "${JSON.stringify(expr)}" did not resolve to a numeric duration.`);
  }
  return Number(parsed.numeric.toFixed(2));
}

function estimateInlineContentWidth(
  axes: Record<string, string>,
  sampleText: string | undefined,
  layoutProof: LayoutProofSpec,
  theme: ThemeContract,
  context: ResolveContext
): number {
  const paddingInline = layoutProof.inlinePadding ? resolveExprToPx(theme, layoutProof.inlinePadding, context) : 0;
  const gap = layoutProof.gap ? resolveExprToPx(theme, layoutProof.gap, context) : 0;
  const fontSize = layoutProof.labelFontSize ? resolveExprToPx(theme, layoutProof.labelFontSize, context) : 16;
  const iconSize = layoutProof.iconSize ? resolveExprToPx(theme, layoutProof.iconSize, context) : 0;
  const hasText = axes.content !== 'icon-only' && Boolean(sampleText);
  const textWidth = hasText ? sampleText!.length * fontSize * 0.56 : 0;
  const hasLeading = axes.content === 'leading' || axes.content === 'leading-trailing';
  const hasTrailing = axes.content === 'trailing' || axes.content === 'leading-trailing';
  const hasIconOnly = axes.content === 'icon-only';

  let inline = paddingInline * 2 + textWidth;
  if (hasIconOnly) {
    inline += iconSize;
  } else {
    if (hasLeading) {
      inline += iconSize + (hasText ? gap : 0);
    }
    if (hasTrailing) {
      inline += iconSize + (hasText ? gap : 0);
    }
  }

  return Number(inline.toFixed(2));
}

function buildContrastProofs(
  proofs: ComponentProofs,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedContrastProof[] {
  return (proofs.contrast ?? []).map((proof) => {
    const foreground = resolveExprToString(theme, proof.foreground, context);
    const background = resolveExprToString(theme, proof.background, context);
    const fontSizePx = resolveExprToPx(theme, proof.fontSize, context);
    const lc = apcaContrast(foreground, background).abs;
    const check = apcaCheck(lc, fontSizePx, proof.fontWeight);
    const minLc = proof.minLc ?? check.minLc;
    return {
      target: proof.target,
      foreground,
      background,
      fontSizePx,
      fontWeight: proof.fontWeight,
      lc,
      minLc,
      pass: lc >= minLc
    };
  });
}

function buildTargetProofs(
  proofs: ComponentProofs,
  componentId: string,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedTargetProof[] {
  return (proofs.target ?? []).map((proof) => {
    const minSizePx = resolveExprToPx(theme, proof.minSize, context);
    const actualExpr = proof.actualSize ?? {
      slotVar: { slot: proof.target, name: `--dk-${componentId}-block-size` }
    };
    const actualSizePx = resolveExprToPx(theme, actualExpr, context);

    return {
      target: proof.target,
      modality: proof.modality,
      actualSizePx,
      minSizePx,
      pass: actualSizePx >= minSizePx
    };
  });
}

function buildLayoutProofs(
  componentId: string,
  proofs: ComponentProofs,
  proofCase: ProofCaseSpec,
  componentCase: CompiledComponentCase,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedLayoutCheck[] {
  return (proofs.layout ? [proofs.layout] : []).map((proof) => {
    const estimatedInlinePx = estimateInlineContentWidth(componentCase.axes, proofCase.sampleText, proof, theme, context);
    const requiredBlockPx = resolveExprToPx(
      theme,
      proof.blockSize ?? { slotVar: { slot: proof.target, name: `--dk-${componentId}-block-size` } },
      context
    );
    const heights = proof.heights ?? [requiredBlockPx];
    const fitsWidth = !proof.noOverflow || proof.widths.some((width) => estimatedInlinePx <= width);
    const fitsHeight = requiredBlockPx <= Math.max(...heights);
    const pass = fitsWidth && fitsHeight;

    return {
      target: proof.target,
      widths: proof.widths,
      heights,
      estimatedInlinePx,
      requiredBlockPx,
      pass
    };
  });
}

function estimateHelperTextWidth(sampleText: string, fontSizePx: number): number {
  return Number((sampleText.length * fontSizePx * 0.52).toFixed(2));
}

function buildHelperTextProofs(
  proofs: HelperTextProofSpec[] | undefined,
  proofCase: ProofCaseSpec,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedHelperTextProof[] {
  return (proofs ?? []).map((proof) => {
    const fontSizePx = resolveExprToPx(theme, proof.fontSize, context);
    const sampleText = proof.sampleText ?? proofCase.sampleText ?? '';
    const lineHeight = proof.lineHeight ?? 1.4;
    const estimatedWidth = estimateHelperTextWidth(sampleText, fontSizePx);
    const estimatedLines = proof.widths.map((width) => Math.max(1, Math.ceil(estimatedWidth / Math.max(width, 1))));
    const pass = estimatedLines.every((lineCount) => lineCount <= proof.maxLines);

    return {
      target: proof.target,
      widths: proof.widths,
      fontSizePx,
      lineHeight,
      maxLines: proof.maxLines,
      estimatedLines,
      pass
    };
  });
}

function buildOptionRowProofs(
  proofs: OptionRowProofSpec[] | undefined,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedOptionRowProof[] {
  return (proofs ?? []).map((proof) => {
    const minSizePx = resolveExprToPx(theme, proof.minSize, context);
    const actualSizePx = resolveExprToPx(theme, proof.actualSize, context);

    return {
      target: proof.target,
      modality: proof.modality,
      actualSizePx,
      minSizePx,
      pass: actualSizePx >= minSizePx
    };
  });
}

function buildAnchoredSurfaceProofs(
  proofs: AnchoredSurfaceProofSpec[] | undefined,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedAnchoredSurfaceCheck[] {
  return (proofs ?? []).map((proof) => {
    const surfaceWidthPx = resolveExprToPx(theme, proof.surfaceWidth, context);
    const surfaceHeightPx = resolveExprToPx(theme, proof.surfaceHeight, context);
    const offsetPx = resolveExprToPx(theme, proof.offset, context);
    const pass =
      offsetPx >= 0 &&
      surfaceWidthPx <= proof.viewportWidth - proof.viewportPadding * 2 &&
      surfaceHeightPx <= proof.viewportHeight - proof.viewportPadding * 2;

    return {
      target: proof.target,
      viewportWidth: proof.viewportWidth,
      viewportHeight: proof.viewportHeight,
      surfaceWidthPx,
      surfaceHeightPx,
      offsetPx,
      viewportPadding: proof.viewportPadding,
      pass
    };
  });
}

function buildMotionProofs(
  proofs: ComponentProofs,
  theme: ThemeContract,
  context: ResolveContext
): ResolvedMotionProof[] {
  return (proofs.motion ?? []).map((proof) => {
    const durationMs = resolveExprToMs(
      theme,
      { slotVar: { slot: proof.target, name: '--dk-motion-duration' } },
      context
    );
    return {
      target: proof.target,
      durationMs,
      durationMaxMs: proof.durationMaxMs,
      pass: durationMs <= proof.durationMaxMs
    };
  });
}

function fixtureId(componentCase: CompiledComponentCase, proofCase: ProofCaseSpec): string {
  const stateKey = (proofCase.states ?? ['rest']).join('+');
  const propsKey = Object.entries(proofCase.props ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${String(value)}`)
    .join('|');
  return [componentCase.caseKey, stateKey, propsKey].filter(Boolean).join('__');
}

export function resolveTokenExpr(
  theme: ThemeContract,
  expr: TokenExpr | number,
  context: ResolveContext = {}
): string | number {
  if (typeof expr === 'number') {
    return expr;
  }

  if ('literal' in expr) {
    return expr.literal;
  }

  if ('alias' in expr) {
    return resolveAlias(theme, expr.alias, new Set());
  }

  if ('ref' in expr) {
    return resolveThemeToken(theme, expr.ref);
  }

  if ('scale' in expr) {
    return resolveThemeToken(theme, `${expr.scale}.${expr.step}`);
  }

  if ('slotVar' in expr) {
    const slotVars = context.slotVars?.[expr.slotVar.slot];
    const value = slotVars?.[expr.slotVar.name];
    if (value === undefined) {
      throw new Error(`Unknown slot var "${expr.slotVar.slot}/${expr.slotVar.name}".`);
    }
    return value;
  }

  if ('onColor' in expr) {
    return autoContrastAPCA(resolveExprToString(theme, expr.onColor, context));
  }

  if ('mul' in expr) {
    const [base, factor] = expr.mul;
    return multiplyNumberish(resolveTokenExpr(theme, base, context), factor);
  }

  throw new Error(`Unsupported token expression: ${JSON.stringify(expr)}.`);
}

export function buildComponentProofFixtures(
  spec: ComponentSpec,
  compiledRecipe: Omit<CompiledComponentRecipe, 'proofFixtures'>,
  theme: ThemeContract
): ComponentProofFixture[] {
  const proofCases: ProofCaseSpec[] = spec.proofCases?.length
    ? spec.proofCases
    : enumerateComponentCases(spec).map((componentCase) => ({
        name: componentCaseKey(componentCase),
        axes: componentCase.axes
      }));

  const fixtures = new Map<string, ComponentProofFixture>();

  for (const proofCase of proofCases) {
    const matches = Object.values(compiledRecipe.cases).filter((componentCase) =>
      Object.entries(proofCase.axes ?? {}).every(([name, value]) => componentCase.axes[name] === value)
    );

    for (const componentCase of matches) {
      const activeStates: ComponentStateName[] = proofCase.states?.length ? proofCase.states : ['rest'];
      const slotVars = resolveSlotVars(componentCase, activeStates);
      const context: ResolveContext = { activeStates, slotVars };
      const contrast = buildContrastProofs(spec.proofs, theme, context);
      const target = buildTargetProofs(spec.proofs, spec.id, theme, context);
      const layout = buildLayoutProofs(spec.id, spec.proofs, proofCase, componentCase, theme, context);
      const helperText = buildHelperTextProofs(spec.proofs.helperText, proofCase, theme, context);
      const optionRow = buildOptionRowProofs(spec.proofs.optionRow, theme, context);
      const anchoredSurface = buildAnchoredSurfaceProofs(spec.proofs.anchoredSurface, theme, context);
      const motion = buildMotionProofs(spec.proofs, theme, context);
      const pass = [...contrast, ...target, ...layout, ...helperText, ...optionRow, ...anchoredSurface, ...motion].every(
        (entry) => entry.pass
      );
      const id = fixtureId(componentCase, proofCase);

      fixtures.set(id, {
        id,
        name: matches.length > 1 ? `${proofCase.name} (${componentCase.caseKey})` : proofCase.name,
        componentId: spec.id,
        themeName: theme.name,
        caseKey: componentCase.caseKey,
        axes: componentCase.axes,
        states: activeStates,
        props: proofCase.props ?? {},
        sampleText: proofCase.sampleText,
        slots: slotVars,
        contrast,
        target,
        layout,
        helperText,
        optionRow,
        anchoredSurface,
        motion,
        resolved: true,
        pass
      });
    }
  }

  return [...fixtures.values()];
}

export function compileComponentRecipe(spec: ComponentSpec, theme: ThemeContract): CompiledComponentRecipe {
  const axisMap = Object.fromEntries(spec.axes.map((axis) => [axis.name, axis.values]));
  const cases: Record<string, CompiledComponentCase> = {};

  for (const componentCase of enumerateComponentCases(spec)) {
    const compiledCase: CompiledComponentCase = {
      caseKey: componentCaseKey(componentCase),
      axes: componentCase.axes,
      slots: {}
    };

    for (const slot of spec.slots) {
      const slotRules = spec.recipe[slot.name] ?? [];
      const compiledSlot: CompiledSlotRecipe = {
        baseVars: {},
        stateVars: {}
      };

      for (const rule of slotRules) {
        if (!matchesAxes(rule.match, componentCase.axes)) {
          continue;
        }

        const resolvedStyle = Object.fromEntries(
          Object.entries(rule.style).map(([name, value]) => [name, resolveExprToString(theme, value)])
        );
        const states = matchedStates(rule.match, spec.states);

        if (states.length === 0) {
          mergeVars(compiledSlot.baseVars, resolvedStyle);
          continue;
        }

        for (const state of states) {
          compiledSlot.stateVars[state] ??= {};
          mergeVars(compiledSlot.stateVars[state]!, resolvedStyle);
        }
      }

      compiledCase.slots[slot.name] = compiledSlot;
    }

    cases[compiledCase.caseKey] = compiledCase;
  }

  const baseRecipe = {
    componentId: spec.id,
    themeName: theme.name,
    axes: axisMap,
    states: spec.states,
    slots: spec.slots.map((slot) => slot.name),
    cases
  };

  return {
    ...baseRecipe,
    proofFixtures: buildComponentProofFixtures(spec, baseRecipe, theme)
  };
}

export function serializeStateVarName(name: string, state: ComponentStateName): string {
  return `${name}-${canonicalStateName(state)}`;
}
