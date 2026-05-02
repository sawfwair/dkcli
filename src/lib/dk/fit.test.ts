import { describe, expect, it } from 'vitest';

import { recommendMetricGrid, verifyContainment, verifyPlanFit } from './fit';

describe('fit', () => {
  it('flags horizontal overflow against a frame budget', () => {
    const report = verifyContainment(
      { width: 280, height: 120 },
      [{ id: 'ratio-select', x: 0, y: 40, width: 312, height: 48 }]
    );

    expect(report.metrics.overflowCount).toBe(1);
    expect(report.metrics.maxOverflowX).toBe(32);
    expect(report.items[0]?.contained).toBe(false);
  });

  it('compares planned geometry against measured boxes', () => {
    const report = verifyPlanFit(
      [
        { id: 'signal', x: 16, y: 16, width: 120, height: 96 },
        { id: 'body', x: 152, y: 16, width: 240, height: 96 }
      ],
      [
        { id: 'signal', x: 16.8, y: 16, width: 119.2, height: 96.6 },
        { id: 'body', x: 151.5, y: 16.4, width: 241, height: 95.8 }
      ],
      { positionTolerance: 2, sizeTolerance: 2 }
    );

    expect(report.metrics.mismatchCount).toBe(0);
    expect(report.metrics.meanDrift).toBeGreaterThan(0);
    expect(report.metrics.score).toBeGreaterThan(90);
  });

  it('recommends fewer metric columns when the container gets tight', () => {
    const recommendation = recommendMetricGrid(320, 3, {
      gap: 12,
      minCellWidth: 124,
      compactThreshold: 156,
      maxColumns: 3
    });

    expect(recommendation.columns).toBe(2);
    expect(recommendation.compact).toBe(true);
    expect(recommendation.cellWidth).toBeGreaterThan(150);
  });

  it('switches metric labels into compact mode before they collapse', () => {
    const recommendation = recommendMetricGrid(432, 3, {
      gap: 12,
      minCellWidth: 124,
      compactThreshold: 156,
      maxColumns: 3
    });

    expect(recommendation.columns).toBe(3);
    expect(recommendation.compact).toBe(true);
    expect(recommendation.cellWidth).toBeLessThan(156);
  });
});
