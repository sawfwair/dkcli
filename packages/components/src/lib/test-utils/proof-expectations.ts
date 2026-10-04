import type { ComponentProofFixture } from '@dkcli/core';
import { expect } from 'vitest';

export type KnownLayoutFailure = { name: string; widths: number[] };

export const BUTTON_LAYOUT_FAILURES: KnownLayoutFailure[] = [
  { name: 'solid-sizes (content=label|size=lg|variant=solid)', widths: [180] },
  { name: 'link-anchor', widths: [180] }
];
export const BADGE_LAYOUT_FAILURES: KnownLayoutFailure[] = ['soft', 'solid', 'outline']
  .map((emphasis) => ({ name: `success-${emphasis}`, widths: [120] }));
export const CHECKBOX_LAYOUT_FAILURES: KnownLayoutFailure[] = ['default', 'checked', 'indeterminate']
  .flatMap((state) => ['sm', 'md', 'lg'].map((size) => ({ name: `${state} (size=${size})`, widths: [240] })));

/** Assert known mathematical limits without treating them as rendered overflow evidence. */
export function expectKnownLayoutFailures(
  fixtures: ComponentProofFixture[],
  fixtureCount: number,
  expected: KnownLayoutFailure[]
): void {
  expect(fixtures).toHaveLength(fixtureCount);
  expect(fixtures.filter((fixture) => !fixture.pass).map((fixture) => fixture.name))
    .toEqual(expected.map((failure) => failure.name));

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

    const knownFailure = expected.find((failure) => failure.name === fixture.name);
    expect(fixture.layout.every((proof) => proof.pass)).toBe(!knownFailure);
    expect(fixture.layout.flatMap((proof) => proof.widthChecks.filter((check) => !check.pass).map((check) => check.width)))
      .toEqual(knownFailure?.widths ?? []);
    for (const proof of fixture.layout) {
      expect(proof.widthChecks.map((check) => check.width)).toEqual(proof.widths);
    }
  }
}
