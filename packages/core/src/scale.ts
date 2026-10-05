import { assertSafeCssCustomPropertyBody } from './css-safety.ts';
import { assertFiniteOutput, assertGeneratedCount, assertPositiveFinite } from './numeric-validation.ts';

export const RATIOS: Record<string, number> = {
  'minor-second': 16 / 15,
  'major-second': 9 / 8,
  'minor-third': 6 / 5,
  'major-third': 5 / 4,
  'perfect-fourth': 4 / 3,
  'augmented-fourth': Math.sqrt(2),
  'perfect-fifth': 3 / 2,
  golden: (1 + Math.sqrt(5)) / 2,
  'major-sixth': 5 / 3,
  octave: 2
};

export const NATURAL_DOWN = ['4xs', '3xs', '2xs', 'xs'];
export const NATURAL_UP = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'];

export type ScaleStep = {
  step: number;
  name: string;
  token: string;
  value: string;
  px: number;
  rem: number;
};

export type ScaleMeta = {
  base: number;
  ratio: number;
  ratioName: string;
  unit: string;
  naming: string;
};

export function resolveRatio(val?: string): { name: string; value: number } {
  if (!val || val === 'golden') return { name: 'golden', value: RATIOS.golden };
  if (Object.hasOwn(RATIOS, val)) return { name: val, value: RATIOS[val] };
  const n = Number(val);
  if (Number.isFinite(n) && n > 1) return { name: 'custom', value: n };
  throw new Error(
    `Unknown ratio: ${val}. Use a name (${Object.keys(RATIOS).join(', ')}) or a number > 1.`
  );
}

export function stepName(step: number, naming: string): string {
  if (naming === 'signed') return step < 0 ? `n${-step}` : String(step);
  if (step === 0) return 'base';
  if (step < 0) {
    const idx = NATURAL_DOWN.length + step;
    return idx >= 0 ? NATURAL_DOWN[idx] : `${-step}xs`;
  }
  return step <= NATURAL_UP.length ? NATURAL_UP[step - 1] : `${step}xl`;
}

function fmtRem(px: number): number {
  return parseFloat((px / 16).toFixed(3));
}

function fmtPx(px: number): number {
  return parseFloat(px.toFixed(1));
}

function validateScaleOptions(base: number, steps: number, down: number, unit: string, prefix: string, naming: string): void {
  assertPositiveFinite(base, 'Scale base');
  assertGeneratedCount(steps, 'Scale steps');
  assertGeneratedCount(down, 'Scale down');
  if (unit !== 'rem' && unit !== 'px') throw new Error('Scale unit must be rem or px.');
  if (naming !== 'natural' && naming !== 'signed') throw new Error('Scale naming must be natural or signed.');
  assertSafeCssCustomPropertyBody(prefix, 'scale prefix');
}

/** Generates finite tokens with integer steps/down from 0 to 10,000 and px or rem units. */
export function generateScale(options: {
  base?: number;
  ratio?: string;
  steps?: number;
  down?: number;
  unit?: string;
  prefix?: string;
  naming?: string;
}): { meta: ScaleMeta; scale: ScaleStep[] } {
  const base = options.base ?? 16;
  const { name: ratioName, value: ratio } = resolveRatio(options.ratio);
  const steps = options.steps ?? 6;
  const down = options.down ?? 2;
  const unit = options.unit ?? 'rem';
  const prefix = options.prefix ?? 'space';
  const naming = options.naming ?? 'natural';

  validateScaleOptions(base, steps, down, unit, prefix, naming);

  const scale: ScaleStep[] = [];
  for (let i = -down; i <= steps; i++) {
    const px = base * Math.pow(ratio, i);
    assertFiniteOutput(px, 'Scale step');
    const name = stepName(i, naming);
    const token = `--${prefix}-${name}`;
    const value = unit === 'rem' ? `${fmtRem(px)}rem` : `${fmtPx(px)}px`;
    scale.push({ step: i, name, token, value, px: fmtPx(px), rem: fmtRem(px) });
  }

  return {
    meta: { base, ratio, ratioName, unit, naming },
    scale
  };
}

export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

/** Extends the Fibonacci recurrence, rejecting overflow and counts outside 0 to 10,000. */
export function generateFibonacciScale(options: {
  base?: number; steps?: number; down?: number; unit?: string; prefix?: string; naming?: string;
} = {}): { meta: ScaleMeta; scale: ScaleStep[] } {
  const base = options.base ?? 16;
  const steps = options.steps ?? 6;
  const down = options.down ?? 2;
  const unit = options.unit ?? 'rem';
  const prefix = options.prefix ?? 'space';
  const naming = options.naming ?? 'natural';
  const centerIdx = 5;

  validateScaleOptions(base, steps, down, unit, prefix, naming);
  const fibonacci = [...FIBONACCI];
  while (fibonacci.length <= centerIdx + steps) {
    const next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
    assertFiniteOutput(next, 'Fibonacci step');
    fibonacci.push(next);
  }

  const scale: ScaleStep[] = [];
  for (let i = -down; i <= steps; i++) {
    const fibIdx = Math.max(0, centerIdx + i);
    const fibVal = fibonacci[fibIdx];
    const px = base * (fibVal / FIBONACCI[centerIdx]);
    assertFiniteOutput(px, 'Fibonacci scale step');
    const name = stepName(i, naming);
    const token = `--${prefix}-${name}`;
    const value = unit === 'rem' ? `${fmtRem(px)}rem` : `${fmtPx(px)}px`;
    scale.push({ step: i, name, token, value, px: fmtPx(px), rem: fmtRem(px) });
  }
  return { meta: { base, ratio: 1.618, ratioName: 'fibonacci', unit, naming }, scale };
}

export type FluidScaleStep = ScaleStep & { clamp: string; pxMin: number; pxMax: number };
export type FluidScaleMeta = ScaleMeta & { baseMin: number; baseMax: number; vwMin: number; vwMax: number };

/** Generates CSS clamp() values for ordered finite sizes/viewports, with 0 to 10,000 steps/down. */
export function generateFluidScale(options: {
  baseMin?: number; baseMax?: number; ratio?: string; steps?: number; down?: number;
  prefix?: string; naming?: string; vwMin?: number; vwMax?: number;
} = {}): { meta: FluidScaleMeta; scale: FluidScaleStep[] } {
  const baseMin = options.baseMin ?? 14;
  const baseMax = options.baseMax ?? 18;
  const { name: ratioName, value: ratio } = resolveRatio(options.ratio);
  const steps = options.steps ?? 6;
  const down = options.down ?? 2;
  const prefix = options.prefix ?? 'space';
  const naming = options.naming ?? 'natural';
  const vwMin = options.vwMin ?? 320;
  const vwMax = options.vwMax ?? 1440;

  validateScaleOptions(baseMin, steps, down, 'rem', prefix, naming);
  assertPositiveFinite(baseMax, 'Fluid maximum base');
  if (baseMax < baseMin) throw new Error('Fluid maximum base must be at least the minimum base.');

  if (!Number.isFinite(vwMin) || !Number.isFinite(vwMax) || vwMin < 0 || vwMax <= vwMin) {
    throw new Error('Fluid viewport widths must be finite, with vw-min >= 0 and vw-max > vw-min.');
  }

  const scale: FluidScaleStep[] = [];
  for (let i = -down; i <= steps; i++) {
    const pxMin = baseMin * Math.pow(ratio, i);
    const pxMax = baseMax * Math.pow(ratio, i);
    assertFiniteOutput(pxMin, 'Fluid minimum step');
    assertFiniteOutput(pxMax, 'Fluid maximum step');
    const remMin = fmtRem(pxMin);
    const remMax = fmtRem(pxMax);
    const name = stepName(i, naming);
    const token = `--${prefix}-${name}`;
    const slope = (pxMax - pxMin) / (vwMax - vwMin);
    const intercept = pxMin - slope * vwMin;
    const interceptRem = parseFloat((intercept / 16).toFixed(4));
    const slopeVw = parseFloat((slope * 100).toFixed(3));
    assertFiniteOutput(interceptRem, 'Fluid intercept');
    assertFiniteOutput(slopeVw, 'Fluid slope');
    const clamp = `clamp(${remMin}rem, ${interceptRem}rem + ${slopeVw}vw, ${remMax}rem)`;
    scale.push({ step: i, name, token, value: clamp, px: fmtPx(pxMax), rem: remMax, clamp, pxMin: fmtPx(pxMin), pxMax: fmtPx(pxMax) });
  }
  return {
    meta: { base: baseMax, ratio, ratioName, unit: 'clamp', naming, baseMin, baseMax, vwMin, vwMax },
    scale
  };
}
