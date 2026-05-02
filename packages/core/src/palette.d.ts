import { type ColorResult } from './color.ts';
import type { ColorSpace, CvdModel, EngineMode, Gamut } from './types.ts';
export declare const STOP_LIGHTNESS: Record<number, number>;
export declare const STOPS: number[];
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
export declare function generateTonal(hex: string, gamut?: Gamut): TonalScale;
export declare function generateNeutral(hex: string, chroma?: number, gamut?: Gamut): TonalScale;
export declare function generateStates(gamut?: Gamut): StateColors;
export declare function semanticLight(tonal: TonalScale, neutral: TonalScale): SemanticTokens;
export declare function semanticDark(tonal: TonalScale, neutral: TonalScale): SemanticTokens;
export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic';
export declare const HARMONIES: Record<HarmonyType, number[]>;
export type HarmonyColor = {
    hex: string;
    hueOffset: number;
    label: string;
    tonal: TonalScale;
};
export type HarmonyResult = {
    type: HarmonyType;
    sourceHex: string;
    sourceHue: number;
    colors: HarmonyColor[];
};
export declare function generateHarmony(hex: string, type: HarmonyType, gamut?: Gamut): HarmonyResult;
export declare function optimizePalette(hex: string, options?: PaletteOptimizeOptions): OptimizedPaletteResult;
