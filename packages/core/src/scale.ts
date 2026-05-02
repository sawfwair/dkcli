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
  if (RATIOS[val]) return { name: val, value: RATIOS[val] };
  const n = Number(val);
  if (n > 1) return { name: 'custom', value: n };
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

  const scale: ScaleStep[] = [];
  for (let i = -down; i <= steps; i++) {
    const px = base * Math.pow(ratio, i);
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

  const scale: ScaleStep[] = [];
  for (let i = -down; i <= steps; i++) {
    const fibIdx = centerIdx + i;
    const fibVal = fibIdx >= 0 && fibIdx < FIBONACCI.length ? FIBONACCI[fibIdx] : FIBONACCI[FIBONACCI.length - 1];
    const px = base * fibVal / FIBONACCI[centerIdx];
    const name = stepName(i, naming);
    const token = `--${prefix}-${name}`;
    const value = unit === 'rem' ? `${fmtRem(px)}rem` : `${fmtPx(px)}px`;
    scale.push({ step: i, name, token, value, px: fmtPx(px), rem: fmtRem(px) });
  }
  return { meta: { base, ratio: 1.618, ratioName: 'fibonacci', unit, naming }, scale };
}

export type FluidScaleStep = ScaleStep & { clamp: string; pxMin: number; pxMax: number };
export type FluidScaleMeta = ScaleMeta & { baseMin: number; baseMax: number; vwMin: number; vwMax: number };

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

  const scale: FluidScaleStep[] = [];
  for (let i = -down; i <= steps; i++) {
    const pxMin = baseMin * Math.pow(ratio, i);
    const pxMax = baseMax * Math.pow(ratio, i);
    const remMin = fmtRem(pxMin);
    const remMax = fmtRem(pxMax);
    const name = stepName(i, naming);
    const token = `--${prefix}-${name}`;
    const slope = (pxMax - pxMin) / (vwMax - vwMin);
    const intercept = pxMin - slope * vwMin;
    const interceptRem = parseFloat((intercept / 16).toFixed(4));
    const slopeVw = parseFloat((slope * 100).toFixed(3));
    const clamp = `clamp(${remMin}rem, ${interceptRem}rem + ${slopeVw}vw, ${remMax}rem)`;
    scale.push({ step: i, name, token, value: clamp, px: fmtPx(pxMax), rem: remMax, clamp, pxMin: fmtPx(pxMin), pxMax: fmtPx(pxMax) });
  }
  return {
    meta: { base: baseMax, ratio, ratioName, unit: 'clamp', naming, baseMin, baseMax, vwMin, vwMax },
    scale
  };
}
