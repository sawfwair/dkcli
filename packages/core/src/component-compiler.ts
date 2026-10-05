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
  type TokenExpr,
  validateComponentSpec
} from './component-spec.ts';
import { assertSafeCssCustomPropertyName, assertSafeCssValue } from './css-safety.ts';
import { analyzeDistinctness, type DistinctnessReport } from './perception.ts';
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
  availableTextPx?: number;
  estimatedLineCount?: number;
  estimatedBlockPx?: number;
  fitsLines?: boolean;
  pass: boolean;
};

/** Lists declared, evaluated, and unsupported proof categories. */
export type ProofCoverage = {
  declared: string[];
  evaluated: string[];
  unsupported: string[];
  complete: boolean;
};

/** Reports estimates for the declared text behavior using maximum token values. */
export type ResolvedLayoutCheck = {
  target: string;
  widths: number[];
  heights: number[];
  estimatedInlinePx: number;
  minimumInlinePx?: number;
  textBehavior?: NonNullable<LayoutProofSpec['textBehavior']>;
  maxLines?: number;
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

function createRecord<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function createResolvedSlotVars(): ResolvedSlotVars {
  return createRecord<string>();
}

function canonicalStateName(state: ComponentStateName): string {
  return state.replace(/[^a-z0-9]+/gi, '-');
}

/** Serializes axis values in name order to form a stable recipe case key. */
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
    return toPx({ numeric: Number(clampMatch[3]), unit: clampMatch[4].toLowerCase() });
  }

  const match = trimmed.match(/^(-?\d*\.?\d+)(px|rem|em|ms|s)?$/i);
  if (!match) {
    return null;
  }

  return { numeric: Number(match[1]), unit: match[2]?.toLowerCase() ?? '' };
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
  if (!Number.isFinite(factor)) throw new Error('Token multiplier must be finite.');
  const multiply = (numeric: number): number => {
    const result = numeric * factor;
    if (!Number.isFinite(result)) throw new Error('Token multiplication exceeds finite numeric bounds.');
    return Number(result.toFixed(3));
  };
  if (typeof value === 'string' && /^clamp\(/i.test(value.trim())) {
    const clamp = value.trim().match(/^clamp\(\s*(-?\d*\.?\d+)(px|rem|em)\s*,\s*(.+)\s*,\s*(-?\d*\.?\d+)(px|rem|em)\s*\)$/i);
    if (!clamp) throw new Error(`Cannot multiply unresolved token "${value}".`);
    const center = clamp[3].trim().replace(/^calc\((.*)\)$/i, '$1').trim();
    if (!/^-?\d*\.?\d+(?:px|rem|em|vw|vh|%)(?:\s+[+-]\s+\d*\.?\d+(?:px|rem|em|vw|vh|%))*$|^0$/i.test(center)) {
      throw new Error(`Cannot multiply unresolved token "${value}".`);
    }
    const bounds = [`${multiply(Number(clamp[1]))}${clamp[2].toLowerCase()}`, `${multiply(Number(clamp[4]))}${clamp[5].toLowerCase()}`];
    if (factor < 0) bounds.reverse();
    const terms = [...center.matchAll(/([+-]?\s*\d*\.?\d+)(px|rem|em|vw|vh|%)/gi)].map((term) => ({
      numeric: multiply(Number(term[1].replace(/\s/g, ''))), unit: term[2].toLowerCase()
    }));
    const scaledCenter = terms.map((term, index) => index === 0 ? `${term.numeric}${term.unit}` : `${term.numeric < 0 ? '-' : '+'} ${Math.abs(term.numeric)}${term.unit}`).join(' ') || '0';
    return `clamp(${bounds[0]}, ${scaledCenter}, ${bounds[1]})`;
  }
  const parsed = parseNumberish(value);
  if (!parsed) {
    throw new Error(`Cannot multiply unresolved token "${String(value)}".`);
  }

  const multiplied = multiply(parsed.numeric);
  return parsed.unit ? `${multiplied}${parsed.unit}` : multiplied;
}

function resolveAlias(theme: ThemeContract, alias: string, seen: Set<string>): string | number {
  if (seen.has(alias)) {
    throw new Error(`Circular theme alias detected for "${alias}".`);
  }

  const resolved = theme.aliases[alias];
  if (!Object.hasOwn(theme.aliases, alias) || !resolved) {
    throw new Error(`Unknown theme alias "${alias}".`);
  }

  seen.add(alias);
  return resolveThemeToken(theme, resolved, seen);
}

function resolveThemeToken(theme: ThemeContract, ref: string, seen: Set<string> = new Set()): string | number {
  if (!ref.includes('.')) {
    return resolveAlias(theme, ref, seen);
  }

  const parts = ref.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error(`Invalid theme token reference "${ref}".`);
  const [familyName, tokenName] = parts as [keyof ThemeContract['families'], string];
  const family = theme.families[familyName];
  if (!Object.hasOwn(theme.families, familyName) || !family) {
    throw new Error(`Unknown theme family "${familyName}" in token ref "${ref}".`);
  }

  if (!Object.hasOwn(family, tokenName)) {
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
  if (!parsed || !['', 'px', 'rem', 'em'].includes(parsed.unit)) {
    throw new Error(`Token "${JSON.stringify(expr)}" did not resolve to a numeric length.`);
  }
  const pixels = toPx(parsed).numeric;
  if (!Number.isFinite(pixels)) {
    throw new Error(`Token "${JSON.stringify(expr)}" did not resolve to a finite length.`);
  }
  return Number(pixels.toFixed(2));
}

function resolveExprToMs(theme: ThemeContract, expr: TokenExpr | number, context: ResolveContext = {}): number {
  const resolved = resolveTokenExpr(theme, expr, context);
  const parsed = parseNumberish(resolved);
  if (!parsed || !['', 'ms', 's'].includes(parsed.unit) || !Number.isFinite(parsed.numeric) || parsed.numeric < 0) {
    throw new Error(`Token "${JSON.stringify(expr)}" did not resolve to a numeric duration.`);
  }
  const milliseconds = parsed.numeric * (parsed.unit === 's' ? 1000 : 1);
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Token "${JSON.stringify(expr)}" did not resolve to a finite duration.`);
  }
  return Number(milliseconds.toFixed(2));
}

function estimateInlineContentWidth(
  axes: Record<string, string>,
  sampleText: string | undefined,
  layoutProof: LayoutProofSpec,
  theme: ThemeContract,
  context: ResolveContext
): { fullInlinePx: number; fixedInlinePx: number; fontSizePx: number; text: string } {
  const paddingInline = layoutProof.inlinePadding ? resolveExprToPx(theme, layoutProof.inlinePadding, context) : 0;
  const gap = layoutProof.gap ? resolveExprToPx(theme, layoutProof.gap, context) : 0;
  const fontSize = layoutProof.labelFontSize ? resolveExprToPx(theme, layoutProof.labelFontSize, context) : 16;
  const iconSize = layoutProof.iconSize ? resolveExprToPx(theme, layoutProof.iconSize, context) : 0;
  const reservedInline = layoutProof.reservedInlineSize !== undefined
    ? resolveExprToPx(theme, layoutProof.reservedInlineSize, context)
    : 0;
  if (!Number.isFinite(reservedInline) || reservedInline < 0) {
    throw new Error('Reserved inline size must be finite and non-negative.');
  }
  const hasText = axes.content !== 'icon-only' && Boolean(sampleText);
  const textWidth = hasText ? sampleText!.length * fontSize * 0.56 : 0;
  const hasLeading = axes.content === 'leading' || axes.content === 'leading-trailing';
  const hasTrailing = axes.content === 'trailing' || axes.content === 'leading-trailing';
  const hasIconOnly = axes.content === 'icon-only';

  let inline = paddingInline * 2 + textWidth + reservedInline;
  if (reservedInline > 0 && hasText) inline += gap;
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

  return {
    fullInlinePx: Number(inline.toFixed(2)),
    fixedInlinePx: inline - textWidth,
    fontSizePx: fontSize,
    text: hasText ? sampleText! : ''
  };
}

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function textGraphemes(text: string): string[] {
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

function estimateTextLines(text: string, availablePx: number, glyphPx: number, anywhere: boolean): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).map((word) => textGraphemes(word).length);
  const capacity = Math.max(1, Math.floor((availablePx + 0.000001) / glyphPx));
  let lines = 1;
  let used = 0;
  for (const length of words) {
    const gap = used > 0 ? 1 : 0;
    if (used + gap + length <= capacity) {
      used += gap + length;
      continue;
    }
    if (used > 0) lines += 1;
    if (anywhere && length > capacity) {
      lines += Math.ceil(length / capacity) - 1;
      used = ((length - 1) % capacity) + 1;
    } else {
      used = length;
    }
  }
  return lines;
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

function buildDistinctnessProofs(proofs: ComponentProofs, theme: ThemeContract): ResolvedDistinctnessProof[] {
  return (proofs.distinctness ?? []).map((proof) => {
    const colors = proof.tokens.map((token) => String(resolveThemeToken(theme, token)));
    const report = analyzeDistinctness(colors, proof.minDeltaE, { cvdModel: 'machado' });
    const pass = report.minDeltaE >= proof.minDeltaE &&
      (!proof.cvd || Object.values(report.cvd).every((result) => result.minDeltaE >= proof.minDeltaE));

    return {
      tokens: proof.tokens,
      colors,
      requiredMinDeltaE: proof.minDeltaE,
      cvd: proof.cvd,
      report,
      pass
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
    const content = estimateInlineContentWidth(componentCase.axes, proofCase.sampleText, proof, theme, context);
    const estimatedInlinePx = content.fullInlinePx;
    const textBehavior = proof.textBehavior ?? 'single-line';
    const glyphPx = content.fontSizePx * 0.56;
    const longestWord = Math.max(0, ...content.text.trim().split(/\s+/).map((word) => textGraphemes(word).length));
    const minimumTextPx = textBehavior === 'wrap'
      ? longestWord * glyphPx
      : content.text ? glyphPx : 0;
    const minimumInlinePx = textBehavior === 'single-line'
      ? estimatedInlinePx
      : Number((content.fixedInlinePx + minimumTextPx).toFixed(2));
    const requiredBlockPx = resolveExprToPx(
      theme,
      proof.blockSize ?? { slotVar: { slot: proof.target, name: `--dk-${componentId}-block-size` } },
      context
    );
    const heights = proof.heights ?? (textBehavior === 'single-line' ? [requiredBlockPx] : []);
    const widthChecks = proof.widths.map((width) => {
      const fitsWidth = !proof.noOverflow || minimumInlinePx <= width;
      if (textBehavior === 'single-line') {
        const fitsHeight = requiredBlockPx <= Math.max(...heights);
        return { width, fitsWidth, fitsHeight, pass: fitsWidth && fitsHeight };
      }
      const availableTextPx = Number(Math.max(0, width - content.fixedInlinePx).toFixed(2));
      const estimatedLineCount = textBehavior === 'scroll'
        ? 1
        : estimateTextLines(content.text, availableTextPx, glyphPx, textBehavior === 'wrap-anywhere');
      const estimatedBlockPx = Number(Math.max(
        requiredBlockPx,
        content.text ? estimatedLineCount * content.fontSizePx * (proof.lineHeight ?? 1.4) : 0
      ).toFixed(2));
      const fitsHeight = heights.length === 0 || estimatedBlockPx <= Math.max(...heights);
      const fitsLines = proof.maxLines === undefined || estimatedLineCount <= proof.maxLines;
      return {
        width, fitsWidth, fitsHeight, availableTextPx, estimatedLineCount, estimatedBlockPx,
        fitsLines, pass: fitsWidth && fitsHeight && fitsLines
      };
    });
    const pass = widthChecks.every((check) => check.pass);

    return {
      target: proof.target,
      widths: proof.widths,
      heights,
      estimatedInlinePx,
      minimumInlinePx,
      textBehavior,
      ...(proof.maxLines !== undefined ? { maxLines: proof.maxLines } : {}),
      requiredBlockPx,
      widthChecks,
      assumptions: [
        'The full single-line estimate uses a 0.56em glyph advance and maximum length token values.',
        ...(textBehavior === 'wrap' || textBehavior === 'wrap-anywhere' ? [
          `Text uses ${textBehavior === 'wrap' ? 'whitespace word boundaries' : 'word boundaries and grapheme-safe breaks'} for estimated wrapping.`,
          ...(proof.lineHeight === undefined ? ['Wrapping uses the default line height of 1.4.'] : []),
          ...(proof.heights === undefined ? ['Block size is a minimum; no maximum height is declared.'] : [])
        ] : []),
        ...(textBehavior === 'scroll' ? ['The native text viewport scrolls horizontally; full text visibility is not verified.'] : []),
        'Font shaping, vertical padding, and rendered container geometry are not measured.'
      ],
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
    const availableWidthPx = proof.viewportWidth - proof.viewportPadding * 2;
    const effectiveSurfaceWidthPx = proof.viewportConstrained
      ? Math.max(0, Math.min(surfaceWidthPx, availableWidthPx))
      : surfaceWidthPx;
    const pass =
      offsetPx >= 0 &&
      effectiveSurfaceWidthPx > 0 &&
      effectiveSurfaceWidthPx <= availableWidthPx &&
      surfaceHeightPx <= proof.viewportHeight - proof.viewportPadding * 2;

    return {
      target: proof.target,
      viewportWidth: proof.viewportWidth,
      viewportHeight: proof.viewportHeight,
      surfaceWidthPx,
      preferredSurfaceWidthPx: surfaceWidthPx,
      effectiveSurfaceWidthPx,
      surfaceHeightPx,
      offsetPx,
      viewportPadding: proof.viewportPadding,
      assumptions: [
        'Static length tokens use a 16px root and border-box surface dimensions.',
        proof.viewportConstrained
          ? 'Authored CSS caps inline size to viewport width minus twice the declared padding.'
          : 'Inline size uses the preferred width without a responsive cap.',
        'Containment estimates do not measure rendered placement or internal content.'
      ],
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

/** Resolves a token expression against a theme and optional slot variables. */
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

/** Evaluates declared mathematical proofs and reports unsupported categories explicitly. */
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
      const distinctness = buildDistinctnessProofs(spec.proofs, theme);
      const target = buildTargetProofs(spec.proofs, spec.id, theme, context);
      const layout = buildLayoutProofs(spec.id, spec.proofs, proofCase, componentCase, theme, context);
      const helperText = buildHelperTextProofs(spec.proofs.helperText, proofCase, theme, context);
      const optionRow = buildOptionRowProofs(spec.proofs.optionRow, theme, context);
      const anchoredSurface = buildAnchoredSurfaceProofs(spec.proofs.anchoredSurface, theme, context);
      const motion = buildMotionProofs(spec.proofs, theme, context);
      const results = { contrast, distinctness, target, layout, helperText, optionRow, anchoredSurface, motion };
      const declared = Object.entries(spec.proofs)
        .filter(([, value]) => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null)
        .map(([kind]) => kind);
      const evaluated = declared.filter((kind) => Object.hasOwn(results, kind));
      const unsupported = declared.filter((kind) => !Object.hasOwn(results, kind));
      const coverage = { declared, evaluated, unsupported, complete: unsupported.length === 0 };
      const pass = coverage.complete && [...contrast, ...distinctness, ...target, ...layout, ...helperText, ...optionRow, ...anchoredSurface, ...motion].every(
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
        distinctness,
        target,
        layout,
        helperText,
        optionRow,
        anchoredSurface,
        motion,
        evidence: 'mathematical',
        coverage,
        resolved: coverage.complete,
        pass
      });
    }
  }

  return [...fixtures.values()];
}

/** Adds recorded viewport widths without removing declared mathematical checks. */
export function compileProjectComponentFixtures(
  spec: ComponentSpec,
  recipe: Omit<CompiledComponentRecipe, 'proofFixtures'>,
  theme: ThemeContract,
  viewports: readonly number[]
): ComponentProofFixture[] {
  if (viewports.some((width) => !Number.isFinite(width) || width <= 0)) {
    throw new Error('Project proof viewports must be positive finite widths.');
  }
  const widths = (declared: number[]): number[] => [...new Set([...declared, ...viewports])];
  const proofs: ComponentProofs = {
    ...spec.proofs,
    ...(spec.proofs.layout ? { layout: { ...spec.proofs.layout, widths: widths(spec.proofs.layout.widths) } } : {}),
    ...(spec.proofs.helperText ? { helperText: spec.proofs.helperText.map((proof) => ({ ...proof, widths: widths(proof.widths) })) } : {}),
    ...(spec.proofs.anchoredSurface ? { anchoredSurface: spec.proofs.anchoredSurface.flatMap((proof) =>
      widths([proof.viewportWidth]).map((viewportWidth) => ({ ...proof, viewportWidth }))) } : {})
  };
  return buildComponentProofFixtures({ ...spec, proofs }, recipe, theme);
}

/** Compiles recipe variables for every axis combination and evaluates mathematical fixtures. */
export function compileComponentRecipe(spec: ComponentSpec, theme: ThemeContract): CompiledComponentRecipe {
  validateComponentSpec(spec);

  const axisMap = createRecord<string[]>();
  for (const axis of spec.axes) {
    axisMap[axis.name] = axis.values;
  }

  const cases: Record<string, CompiledComponentCase> = createRecord();

  for (const componentCase of enumerateComponentCases(spec)) {
    const compiledCase: CompiledComponentCase = {
      caseKey: componentCaseKey(componentCase),
      axes: componentCase.axes,
      slots: {}
    };

    for (const slot of spec.slots) {
      const slotRules = spec.recipe[slot.name] ?? [];
      const compiledSlot: CompiledSlotRecipe = {
        baseVars: createResolvedSlotVars(),
        stateVars: Object.create(null) as Partial<Record<ComponentStateName, ResolvedSlotVars>>
      };

      for (const rule of slotRules) {
        if (!matchesAxes(rule.match, componentCase.axes)) {
          continue;
        }

        const resolvedStyle = createResolvedSlotVars();
        for (const [name, value] of Object.entries(rule.style)) {
          assertSafeCssCustomPropertyName(name, `component ${spec.id} style`);
          resolvedStyle[name] = assertSafeCssValue(resolveExprToString(theme, value), name);
        }
        const states = matchedStates(rule.match, spec.states);

        if (states.length === 0) {
          mergeVars(compiledSlot.baseVars, resolvedStyle);
          continue;
        }

        for (const state of states) {
          compiledSlot.stateVars[state] ??= createResolvedSlotVars();
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

/** Adds a normalized state suffix to a CSS variable name. */
export function serializeStateVarName(name: string, state: ComponentStateName): string {
  return `${name}-${canonicalStateName(state)}`;
}
