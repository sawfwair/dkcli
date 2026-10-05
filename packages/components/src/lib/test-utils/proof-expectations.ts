import type { ComponentProofFixture, LayoutProofSpec } from '@dkcli/core';
import { expect } from 'vitest';

export type DeclaredLayoutBehavior = {
  textBehavior: NonNullable<LayoutProofSpec['textBehavior']>;
  widths: number[];
  heights: number[];
};

export const DECLARED_LAYOUT_BEHAVIORS: Record<string, DeclaredLayoutBehavior> = {
  accordion: { textBehavior: 'wrap-anywhere', widths: [320, 420], heights: [160] },
  badge: { textBehavior: 'wrap-anywhere', widths: [120, 200], heights: [] },
  breadcrumbs: { textBehavior: 'wrap', widths: [220, 320], heights: [] },
  button: { textBehavior: 'wrap-anywhere', widths: [180, 240, 320], heights: [] },
  checkbox: { textBehavior: 'wrap', widths: [240, 320], heights: [] },
  'text-field': { textBehavior: 'scroll', widths: [240, 320, 420], heights: [44, 48, 52] }
};

/** Assert declared mathematical behavior without treating it as rendered evidence. */
export function expectDeclaredLayoutBehavior(
  fixtures: ComponentProofFixture[],
  fixtureCount: number,
  expected?: DeclaredLayoutBehavior
): void {
  expect(fixtures).toHaveLength(fixtureCount);
  expect(new Set(fixtures.map((fixture) => fixture.id)).size).toBe(fixtureCount);
  expect(fixtures.filter((fixture) => !fixture.pass).map((fixture) => fixture.name)).toEqual([]);

  for (const fixture of fixtures) {
    expect(fixture.evidence).toBe('mathematical');
    expect(fixture.resolved).toBe(true);
    expect(fixture.coverage.complete).toBe(true);
    expect(fixture.coverage.unsupported).toEqual([]);
    expect(fixture.coverage.evaluated).toEqual(fixture.coverage.declared);
    expect([
      ...fixture.contrast, ...fixture.distinctness, ...fixture.target, ...fixture.helperText,
      ...fixture.optionRow, ...fixture.anchoredSurface, ...fixture.motion
    ].every((proof) => proof.pass)).toBe(true);

    expect(fixture.layout.every((proof) => proof.pass)).toBe(true);
    expect(fixture.layout.flatMap((proof) => proof.widthChecks.filter((check) => !check.pass).map((check) => check.width)))
      .toEqual([]);
    for (const proof of fixture.layout) {
      expect(proof.widthChecks.map((check) => check.width)).toEqual(proof.widths);
      expect(proof.textBehavior).toBe(expected?.textBehavior ?? 'single-line');
      expect(proof.minimumInlinePx).toBeLessThanOrEqual(proof.estimatedInlinePx);
      if (expected) {
        expect(proof.widths).toEqual(expected.widths);
        expect(proof.heights).toEqual(expected.heights);
        for (const check of proof.widthChecks) {
          expect(check.availableTextPx).toBeGreaterThanOrEqual(0);
          expect(check.estimatedLineCount).toBeGreaterThanOrEqual(0);
          expect(check.estimatedBlockPx).toBeGreaterThanOrEqual(proof.requiredBlockPx);
        }
      }
    }
  }
}
