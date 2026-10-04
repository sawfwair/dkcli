import { type TypesetResult } from './typeset.ts';
import type { EngineMode, WhiteSpaceMode } from './types.ts';
export type TypographyProfile = 'default' | 'low-vision';
export type TypographyInput = {
    fontSize: number;
    containerWidth: number;
    contrastLc?: number;
    profile?: TypographyProfile;
    engine?: EngineMode;
    sampleText?: string;
    language?: string;
    hyphenate?: boolean;
    whiteSpace?: WhiteSpaceMode;
};
export type TypographyRecommendation = {
    charactersPerLine: number;
    lineHeight: number;
    letterSpacingEm: number;
    wordSpacingEm: number;
    paragraphSpacingPx: number;
    crowdingRisk: 'low' | 'moderate' | 'high';
    warnings: string[];
    engine: EngineMode;
    advanced?: TypesetResult;
};
export declare function recommendTypography(input: TypographyInput): TypographyRecommendation;
