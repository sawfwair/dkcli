import { describe, expect, it } from 'vitest';

import { compileComponentRecipe, type ResolvedLayoutCheck } from './component-compiler.ts';
import type { ComponentSpec, LayoutProofSpec, TokenExpr } from './component-spec.ts';
import type { ThemeContract } from './theme-contract.ts';

// Structural extension keeps the regression executable before the public contract lands.
type TextLayout = LayoutProofSpec & {
  textBehavior?: 'single-line' | 'wrap' | 'wrap-anywhere' | 'scroll';
  reservedInlineSize?: TokenExpr | number;
  lineHeight?: number;
  maxLines?: number;
};

const theme: ThemeContract = {
  name: 'text-layout-regression',
  seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
  meta: { density: 'comfortable', mode: 'light', optimizedSeed: '#295dff', paletteScore: 1, ratioName: 'perfect fourth', ratioValue: 1.333 },
  families: { color: {}, elevation: {}, motion: {}, radius: {}, space: {}, state: {}, type: {} },
  aliases: {}
};

function compileLayout(overrides: Partial<TextLayout> = {}, sampleText = 'alpha beta gamma'): ResolvedLayoutCheck {
  const layout: TextLayout = {
    target: 'root', widths: [96, 192], noOverflow: true,
    blockSize: 24, inlinePadding: 8, labelFontSize: 16, lineHeight: 1.25,
    ...overrides
  };
  const spec: ComponentSpec = {
    id: 'text-layout', slots: [{ name: 'root', kind: 'container', required: true }],
    axes: [], states: ['rest'], recipe: { root: [] },
    proofs: { layout }, proofCases: [{ name: 'label', sampleText }], a11y: { role: 'group' }
  };
  return compileComponentRecipe(spec, theme).proofFixtures[0].layout[0];
}

describe('declared layout text behavior', () => {
  it('preserves the legacy single-line verdict at every width', () => {
    const proof = compileLayout();
    expect(proof.estimatedInlinePx).toBe(159.36);
    expect(proof.widthChecks.map(({ width, fitsWidth, pass }) => ({ width, fitsWidth, pass }))).toEqual([
      { width: 96, fitsWidth: false, pass: false },
      { width: 192, fitsWidth: true, pass: true }
    ]);
    expect(proof.pass).toBe(false);
  });

  it('fits wrapping words without discarding the full single-line estimate', () => {
    const proof = compileLayout({ textBehavior: 'wrap' });
    expect(proof).toMatchObject({ textBehavior: 'wrap', estimatedInlinePx: 159.36, minimumInlinePx: 60.8, pass: true });
    expect(proof.widthChecks).toMatchObject([
      { width: 96, availableTextPx: 80, estimatedLineCount: 3, estimatedBlockPx: 60, fitsWidth: true, fitsHeight: true, pass: true },
      { width: 192, availableTextPx: 176, estimatedLineCount: 1, estimatedBlockPx: 24, pass: true }
    ]);
  });

  it('keeps an unbreakable word failing under ordinary wrapping', () => {
    const proof = compileLayout({ textBehavior: 'wrap' }, 'abcdefghijklmno');
    expect(proof).toMatchObject({ minimumInlinePx: 150.4, pass: false });
    expect(proof.widthChecks).toMatchObject([{ width: 96, fitsWidth: false, pass: false }, { width: 192, fitsWidth: true, pass: true }]);
  });

  it('allows arbitrary wrapping only when declared and never splits a grapheme cluster', () => {
    const proof = compileLayout({ textBehavior: 'wrap-anywhere', widths: [8, 9, 18], inlinePadding: 0 }, 'e\u0301e\u0301e\u0301');
    expect(proof).toMatchObject({ textBehavior: 'wrap-anywhere', minimumInlinePx: 8.96 });
    expect(proof.widthChecks).toMatchObject([
      { width: 8, fitsWidth: false, pass: false },
      { width: 9, estimatedLineCount: 3, fitsWidth: true, pass: true },
      { width: 18, estimatedLineCount: 2, fitsWidth: true, pass: true }
    ]);
  });

  it('reserves persistent chrome before assigning width to wrapping text', () => {
    const proof = compileLayout({ textBehavior: 'wrap', reservedInlineSize: 24, widths: [80, 96] });
    expect(proof).toMatchObject({ estimatedInlinePx: 183.36, minimumInlinePx: 84.8, pass: false });
    expect(proof.widthChecks).toMatchObject([
      { width: 80, availableTextPx: 40, fitsWidth: false, pass: false },
      { width: 96, availableTextPx: 56, fitsWidth: true, pass: true }
    ]);
  });

  it('checks wrapping height against an explicit height budget at each width', () => {
    const proof = compileLayout({ textBehavior: 'wrap', heights: [40] });
    expect(proof.widthChecks).toMatchObject([
      { width: 96, estimatedLineCount: 3, estimatedBlockPx: 60, fitsWidth: true, fitsHeight: false, pass: false },
      { width: 192, estimatedBlockPx: 24, fitsHeight: true, pass: true }
    ]);
    expect(proof.pass).toBe(false);
  });

  it('rejects a wrapped label exceeding the declared line budget', () => {
    const proof = compileLayout({ textBehavior: 'wrap', maxLines: 2 });
    expect(proof.widthChecks).toMatchObject([{ width: 96, estimatedLineCount: 3, pass: false }, { width: 192, estimatedLineCount: 1, pass: true }]);
    expect(proof.pass).toBe(false);
  });

  it('records a default line-height assumption when the author omits it', () => {
    const proof = compileLayout({ textBehavior: 'wrap', lineHeight: undefined });
    expect(proof.assumptions.join(' ')).toMatch(/default.*line.height|line.height.*default/i);
  });

  it('models a native scrolling viewport without claiming that all text is visible', () => {
    const proof = compileLayout({ textBehavior: 'scroll', widths: [12, 96] });
    expect(proof).toMatchObject({ textBehavior: 'scroll', estimatedInlinePx: 159.36, pass: false });
    expect(proof.widthChecks).toMatchObject([
      { width: 12, fitsWidth: false, pass: false },
      { width: 96, availableTextPx: 80, estimatedLineCount: 1, fitsWidth: true, pass: true }
    ]);
    expect(proof.assumptions.join(' ')).toMatch(/scroll/i);
    expect(proof.assumptions.join(' ')).toMatch(/(?:full|all).*text.*(?:visibility|visible).*(?:not|unverified)|(?:not|no|without|does not).*(?:full|all).*text.*(?:visibility|visible)/i);
  });

  it.each([
    { textBehavior: 'unrestricted' },
    { textBehavior: ['wrap'] },
    { reservedInlineSize: -1 },
    { reservedInlineSize: Number.POSITIVE_INFINITY },
    { reservedInlineSize: Number.NaN },
    { lineHeight: 0 },
    { lineHeight: -1 },
    { lineHeight: Number.POSITIVE_INFINITY },
    { lineHeight: Number.NaN },
    { maxLines: 0 },
    { maxLines: -1 },
    { maxLines: 1.5 },
    { maxLines: Number.POSITIVE_INFINITY },
    { maxLines: Number.NaN }
  ])('rejects a malformed text behavior or budget: %j', (value) => {
    const malformed = value as Partial<TextLayout>;
    expect(() => compileLayout(malformed)).toThrow();
  });
});
