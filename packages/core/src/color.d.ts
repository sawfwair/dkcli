import type { ColorSpace, Gamut } from './types.ts';
export type ColorResult = {
    oklch: string;
    hex: string;
    css: string;
    l: number;
    c: number;
    h: number;
    gamut: Gamut;
};
export type ParsedColor = {
    hex: string;
    css: string;
    oklch: [number, number, number];
    cam16Ucs: [number, number, number];
    jzazbz: [number, number, number];
    gamut: Gamut;
};
export declare function hexToSrgb(hex: string): [number, number, number];
export declare function srgbToHex(r: number, g: number, b: number): string;
export declare function srgbToLinear(c: number): number;
export declare function linearToSrgb(c: number): number;
export declare function hexToOklch(input: string): [number, number, number];
export declare function oklchToSrgb(L: number, C: number, H: number): [number, number, number];
export declare function oklchToHex(L: number, C: number, H: number): string;
export declare function oklchInGamut(L: number, C: number, H: number, gamut?: Gamut): boolean;
export declare function gamutClip(L: number, C: number, H: number, gamut?: Gamut): [number, number, number];
export declare function hexToCam16Ucs(input: string): [number, number, number];
export declare function hexToJzazbz(input: string): [number, number, number];
/** Returns the original CSS color opacity before gamut conversion or hex rounding. */
export declare function cssColorAlpha(input: string): number;
export declare function parseCssColor(input: string, gamut?: Gamut): ParsedColor;
export declare function toColorSpace(input: string, space: ColorSpace): [number, number, number];
export declare function serializeColorSpace(coords: [number, number, number], space?: ColorSpace, gamut?: Gamut): string;
export declare function luminance(hex: string): number;
/** Computes the WCAG contrast ratio for two colors, without evaluating page compliance. */
export declare function contrastRatio(hex1: string, hex2: string): number;
/** Selects the higher-contrast light or dark foreground by contrast ratio. */
export declare function autoContrast(bgHex: string): string;
export type APCAResult = {
    Lc: number;
    polarity: 'light-bg' | 'dark-bg';
    abs: number;
};
export type SizeWeightCheck = {
    pass: boolean;
    minLc: number;
    recommendation: string;
};
export declare function hexToY(hex: string): number;
/** Computes signed APCA lightness contrast for foreground and background colors. */
export declare function apcaContrast(fgHex: string, bgHex: string): APCAResult;
/** Checks APCA contrast against DesignKit font size and weight thresholds, without WCAG certification. */
export declare function apcaCheck(Lc: number, size: number, weight: number): SizeWeightCheck;
/** Selects the higher-contrast light or dark foreground by absolute APCA contrast. */
export declare function autoContrastAPCA(bgHex: string): string;
export declare function fmtOklch(L: number, C: number, H: number): string;
export declare function makeColor(L: number, C: number, H: number, gamut?: Gamut): ColorResult;
