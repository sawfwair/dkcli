// Typography — Reading comfort recommendations from line length, spacing, and crowding.

import { typesetParagraph, type TypesetOptions, type TypesetResult } from './typeset.ts';
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

function scoreCrowdingRisk(
  charsPerLine: number,
  lineHeight: number,
  contrastLc: number,
  profile: TypographyProfile
): 'low' | 'moderate' | 'high' {
  let risk = 0;
  if (charsPerLine > 78) risk += 1;
  if (lineHeight < 1.45) risk += 1;
  if (contrastLc < 60) risk += 1;
  if (profile === 'low-vision') risk += 1;

  if (risk >= 3) return 'high';
  if (risk >= 2) return 'moderate';
  return 'low';
}

export function recommendTypography(input: TypographyInput): TypographyRecommendation {
  const engine = input.engine ?? 'basic';
  const profile = input.profile ?? 'default';
  const contrastLc = input.contrastLc ?? 75;
  const averageGlyphWidth = input.fontSize * 0.52;
  const charactersPerLine = parseFloat((input.containerWidth / averageGlyphWidth).toFixed(1));

  let lineHeight = 1.45;
  let letterSpacingEm = 0;
  let wordSpacingEm = 0.16;

  if (input.fontSize < 15) {
    lineHeight += 0.05;
    letterSpacingEm += 0.01;
  }
  if (charactersPerLine > 68) {
    lineHeight += 0.06;
  }
  if (contrastLc < 60) {
    lineHeight += 0.12;
    letterSpacingEm += 0.01;
    wordSpacingEm += 0.04;
  }
  if (profile === 'low-vision') {
    lineHeight += 0.18;
    letterSpacingEm += 0.02;
    wordSpacingEm += 0.08;
  }

  const warnings: string[] = [];
  if (charactersPerLine > 78) {
    warnings.push('Line length is long; reduce measure or increase font size.');
  }
  if (contrastLc < 60) {
    warnings.push('Low contrast benefits from more generous spacing.');
  }
  if (profile === 'low-vision' && charactersPerLine > 55) {
    warnings.push('Low-vision mode prefers shorter measures near 45–55 characters.');
  }

  const finalLineHeight = parseFloat(lineHeight.toFixed(2));
  let advanced: TypesetResult | undefined;
  if (engine !== 'basic' && input.sampleText?.trim()) {
    const options: TypesetOptions = {
      text: input.sampleText,
      widthPx: input.containerWidth,
      fontSize: input.fontSize,
      lineHeight: finalLineHeight,
      language: input.language,
      hyphenate: input.hyphenate,
      opticalSizing: true,
      whiteSpace: input.whiteSpace,
      engine: 'advanced'
    };
    advanced = typesetParagraph(options);
  }
  return {
    charactersPerLine,
    lineHeight: finalLineHeight,
    letterSpacingEm: parseFloat(letterSpacingEm.toFixed(3)),
    wordSpacingEm: parseFloat(wordSpacingEm.toFixed(3)),
    paragraphSpacingPx: Math.round(input.fontSize * finalLineHeight * 0.8),
    crowdingRisk: scoreCrowdingRisk(charactersPerLine, finalLineHeight, contrastLc, profile),
    warnings,
    engine,
    advanced
  };
}
