import {
  apcaContrast,
  autoContrast,
  makeColor,
  oklchToHex,
  parseCssColor,
  type ColorResult
} from './color.ts';
import { analyzeDistinctness } from './perception.ts';
import type { ColorSpace, CvdModel, EngineMode, Gamut } from './types.ts';

export const STOP_LIGHTNESS: Record<number, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.78,
  400: 0.68,
  500: 0.57,
  600: 0.47,
  700: 0.37,
  800: 0.29,
  900: 0.21,
  950: 0.14
};

export const STOPS: number[] = Object.keys(STOP_LIGHTNESS).map(Number);

export type TonalScale = Record<number, ColorResult>;
export type StateColors = Record<string, ColorResult | string>;
export type SemanticTokens = Record<string, ColorResult | string>;

export type PaletteResult = {
  tonal: TonalScale;
  neutral: TonalScale;
  states: StateColors;
  light: SemanticTokens | null;
  dark: SemanticTokens | null;
};

export type PaletteOptimizeOptions = {
  engine?: EngineMode;
  goal?: 'ui' | 'viz';
  gamut?: Gamut;
  space?: ColorSpace;
  cvdModel?: CvdModel;
  optimize?: boolean;
};

export type OptimizedPaletteResult = PaletteResult & {
  seedHex: string;
  gamut: Gamut;
  space: ColorSpace;
  scores: {
    apca: number;
    distinctness: number;
    cvd: number;
    harmony: number;
    total: number;
  };
};

export function generateTonal(hex: string, gamut: Gamut = 'srgb'): TonalScale {
  const [L_in, C_in, H_in] = parseCssColor(hex, gamut).oklch;
  const isAchromatic = C_in < 0.01;
  const sinInput = Math.sin(Math.PI * L_in);
  const C_peak = sinInput > 0.01 ? C_in / sinInput : C_in;

  const scale: TonalScale = {};
  for (const stop of STOPS) {
    const L = STOP_LIGHTNESS[stop];
    const C = isAchromatic ? 0 : C_peak * Math.sin(Math.PI * L);
    scale[stop] = makeColor(L, C, H_in, gamut);
  }
  return scale;
}

export function generateNeutral(hex: string, chroma: number = 0.007, gamut: Gamut = 'srgb'): TonalScale {
  const [, , H_in] = parseCssColor(hex, gamut).oklch;
  const scale: TonalScale = {};
  for (const stop of STOPS) {
    const L = STOP_LIGHTNESS[stop];
    scale[stop] = makeColor(L, chroma, H_in, gamut);
  }
  return scale;
}

export function generateStates(gamut: Gamut = 'srgb'): StateColors {
  const defs = [
    { name: 'error', l: 0.55, c: 0.2, h: 25 },
    { name: 'warning', l: 0.75, c: 0.16, h: 85 },
    { name: 'success', l: 0.6, c: 0.17, h: 145 }
  ];
  const result: StateColors = {};
  for (const { name, l, c, h } of defs) {
    const color = makeColor(l, c, h, gamut);
    result[name] = color;
    result[`on-${name}`] = autoContrast(color.hex);
  }
  return result;
}

export function semanticLight(tonal: TonalScale, neutral: TonalScale): SemanticTokens {
  return {
    primary: tonal[500],
    'on-primary': autoContrast(tonal[500].hex),
    'primary-container': tonal[100],
    'on-primary-container': tonal[900],
    surface: neutral[50],
    'on-surface': neutral[900],
    'surface-dim': neutral[100],
    'surface-bright': neutral[50],
    outline: neutral[400]
  };
}

export function semanticDark(tonal: TonalScale, neutral: TonalScale): SemanticTokens {
  return {
    primary: tonal[300],
    'on-primary': tonal[900],
    'primary-container': tonal[800],
    'on-primary-container': tonal[100],
    surface: neutral[950],
    'on-surface': neutral[100],
    'surface-dim': neutral[900],
    'surface-bright': neutral[800],
    outline: neutral[600]
  };
}

export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';

export const HARMONIES: Record<HarmonyType, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  'split-complementary': [0, 150, 210],
  tetradic: [0, 90, 180, 270]
};

const HARMONY_LABELS = ['primary', 'secondary', 'tertiary', 'quaternary'];

export type HarmonyColor = { hex: string; hueOffset: number; label: string; tonal: TonalScale };
export type HarmonyResult = { type: HarmonyType; sourceHex: string; sourceHue: number; colors: HarmonyColor[] };

export function generateHarmony(hex: string, type: HarmonyType, gamut: Gamut = 'srgb'): HarmonyResult {
  const [L, C, H] = parseCssColor(hex, gamut).oklch;
  const offsets = HARMONIES[type];
  const colors: HarmonyColor[] = offsets.map((offset, index) => {
    const hue = ((H + offset) % 360 + 360) % 360;
    const harmonyHex = oklchToHex(L, C, hue);
    return {
      hex: harmonyHex,
      hueOffset: offset,
      label: HARMONY_LABELS[index] || `color-${index}`,
      tonal: generateTonal(harmonyHex, gamut)
    };
  });
  return { type, sourceHex: hex, sourceHue: Math.round(H), colors };
}

function tokenHex(value: ColorResult | string): string {
  return typeof value === 'string' ? value : value.hex;
}

function scoreCandidate(
  seedHex: string,
  tonal: TonalScale,
  neutral: TonalScale,
  options: Required<Omit<PaletteOptimizeOptions, 'engine' | 'optimize'>>
): OptimizedPaletteResult['scores'] {
  const light = semanticLight(tonal, neutral);
  const dark = semanticDark(tonal, neutral);
  const states = generateStates(options.gamut);
  const uiPairs = [
    [tokenHex(light['on-primary']), tokenHex(light.primary)],
    [tokenHex(light['on-surface']), tokenHex(light.surface)],
    [tokenHex(dark['on-primary']), tokenHex(dark.primary)],
    [tokenHex(states['on-success']), tokenHex(states.success)]
  ];
  const apca = uiPairs.reduce((sum, [fg, bg]) => sum + Math.abs(apcaContrast(fg, bg).Lc), 0) / uiPairs.length;
  const distinct = analyzeDistinctness(
    [
      tokenHex(light.primary),
      tokenHex(light.surface),
      tokenHex(light.outline),
      tokenHex(states.error),
      tokenHex(states.success),
      tokenHex(states.warning)
    ],
    options.goal === 'viz' ? 16 : 12,
    {
      space: options.space,
      gamut: options.gamut,
      cvdModel: options.cvdModel,
      severity: 1
    }
  );
  const cvdMin = Math.min(distinct.cvd.protan.minDeltaE, distinct.cvd.deutan.minDeltaE, distinct.cvd.tritan.minDeltaE);
  const harmony = generateHarmony(seedHex, options.goal === 'viz' ? 'triadic' : 'analogous', options.gamut);
  const harmonySpread =
    harmony.colors.reduce((sum, color) => sum + Math.abs(color.hueOffset), 0) / harmony.colors.length;

  return {
    apca: parseFloat((apca / 100).toFixed(3)),
    distinctness: parseFloat((distinct.minDeltaE / (options.goal === 'viz' ? 18 : 14)).toFixed(3)),
    cvd: parseFloat((cvdMin / 12).toFixed(3)),
    harmony: parseFloat((Math.min(harmonySpread, 180) / 180).toFixed(3)),
    total: 0
  };
}

export function optimizePalette(
  hex: string,
  options: PaletteOptimizeOptions = {}
): OptimizedPaletteResult {
  const engine = options.engine ?? 'advanced';
  const goal = options.goal ?? 'ui';
  const gamut = options.gamut ?? 'srgb';
  const space = options.space ?? 'oklch';
  const cvdModel = options.cvdModel ?? 'machado';

  if (engine === 'basic' || options.optimize === false) {
    const tonal = generateTonal(hex, gamut);
    const neutral = generateNeutral(hex, 0.007, gamut);
    const states = generateStates(gamut);
    const light = semanticLight(tonal, neutral);
    const dark = semanticDark(tonal, neutral);
    const scores = scoreCandidate(hex, tonal, neutral, { goal, gamut, space, cvdModel });
    scores.total = parseFloat(((scores.apca * 0.4 + scores.distinctness * 0.28 + scores.cvd * 0.2 + scores.harmony * 0.12) * 100).toFixed(1));
    return { seedHex: hex, tonal, neutral, states, light, dark, gamut, space, scores };
  }

  const [seedL, seedC, seedH] = parseCssColor(hex, gamut).oklch;
  const hueOffsets = goal === 'viz' ? [-24, -12, 0, 12, 24, 36] : [-18, -9, 0, 9, 18];
  const chromaFactors = goal === 'viz' ? [0.85, 1, 1.12, 1.24] : [0.8, 0.92, 1, 1.08];
  const lightnessOffsets = [-0.04, -0.02, 0, 0.02, 0.04];

  let best:
    | {
        seedHex: string;
        tonal: TonalScale;
        neutral: TonalScale;
        scores: OptimizedPaletteResult['scores'];
      }
    | undefined;

  for (const hueOffset of hueOffsets) {
    for (const chromaFactor of chromaFactors) {
      for (const lightnessOffset of lightnessOffsets) {
        const candidateHex = oklchToHex(
          Math.min(Math.max(seedL + lightnessOffset, 0.18), 0.86),
          Math.max(seedC * chromaFactor, 0.02),
          ((seedH + hueOffset) % 360 + 360) % 360
        );
        const neutralChroma = goal === 'viz' ? 0.012 : 0.008;
        const tonal = generateTonal(candidateHex, gamut);
        const neutral = generateNeutral(candidateHex, neutralChroma, gamut);
        const scores = scoreCandidate(candidateHex, tonal, neutral, { goal, gamut, space, cvdModel });
        scores.total = parseFloat(
          (
            scores.apca * 0.42 +
            scores.distinctness * 0.26 +
            scores.cvd * 0.22 +
            scores.harmony * 0.1
          ).toFixed(4)
        );

        if (!best || scores.total > best.scores.total) {
          best = { seedHex: candidateHex, tonal, neutral, scores };
        }
      }
    }
  }

  const tonal = best?.tonal ?? generateTonal(hex, gamut);
  const neutral = best?.neutral ?? generateNeutral(hex, 0.007, gamut);
  const states = generateStates(gamut);
  const light = semanticLight(tonal, neutral);
  const dark = semanticDark(tonal, neutral);

  return {
    seedHex: best?.seedHex ?? hex,
    tonal,
    neutral,
    states,
    light,
    dark,
    gamut,
    space,
    scores: best?.scores ?? scoreCandidate(hex, tonal, neutral, { goal, gamut, space, cvdModel })
  };
}
