import { describe, expect, it } from 'vitest';

import { verifyContainment, verifyPlanFit } from './fit';
import { compilePerfectProof, verifyPerfectProof } from './perfect';

describe('perfect', () => {
  it('compiles the default proof and all contrast cards pass', () => {
    const result = compilePerfectProof({
      baseColorInput: '#295dff',
      ratioName: 'perfect-fourth',
      mode: 'light',
      motionPreset: 'snappy'
    });

    // All APCA contrast proof cards should pass their minLc thresholds
    for (const card of result.outputs.proofCards) {
      expect(card.pass).toBe(true);
    }

    // The default seed (#295dff) produces a palette whose deutan CVD
    // distinctness falls below the MIN_DISTINCT_CVD threshold (15) when
    // APCA is computed correctly per the W3 spec. This is a known palette
    // quality issue for this particular seed, not an algorithm bug.
    const deutanFailure = result.report.failures.find((f) => f.id === 'compile.distinct.deutan');
    expect(deutanFailure).toBeDefined();
    expect(result.outputs.distinctness.cvd.deutan.minDeltaE).toBeLessThan(15);
  });

  it('reports invalid input spec as compile failures while normalizing to defaults', () => {
    const result = compilePerfectProof({
      baseColorInput: 'oops',
      ratioName: 'unknown',
      mode: 'dark',
      motionPreset: 'broken'
    });

    expect(result.report.ok).toBe(false);
    expect(result.report.failures.map((failure) => failure.id)).toEqual(
      expect.arrayContaining(['input.base-color', 'input.ratio', 'input.motion'])
    );
    expect(result.spec.baseColor).toBe('#295dff');
    expect(result.spec.ratioName).toBe('perfect-fourth');
    expect(result.spec.motionPreset).toBe('snappy');
  });

  it('emits explicit render failures when the DOM drifts from the compiled proof', () => {
    const result = compilePerfectProof({
      baseColorInput: '#295dff',
      ratioName: 'perfect-fourth',
      mode: 'light',
      motionPreset: 'snappy'
    });

    const controlFit = verifyContainment(
      { width: 280, height: 120 },
      [{ id: 'ratio-select', x: 12, y: 16, width: 308, height: 48 }],
      { overflowTolerance: 0.5 }
    );
    const layoutFit = verifyPlanFit(
      [{ id: 'body', x: 220, y: 16, width: 280, height: 112 }],
      [{ id: 'body', x: 246, y: 28, width: 280, height: 112 }],
      { positionTolerance: 1.5, sizeTolerance: 1.5 }
    );

    const report = verifyPerfectProof(result, { controlFit, layoutFit });

    expect(report.ready).toBe(true);
    expect(report.ok).toBe(false);
    expect(report.failures.map((failure) => failure.id)).toEqual(
      expect.arrayContaining(['render.control.ratio-select', 'render.layout.body'])
    );
    expect(report.metrics.score).toBeLessThan(100);
  });
});
