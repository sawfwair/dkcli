import { describe, expect, it } from 'vitest';
import { verifyContainment, verifyPlanFit, recommendMetricGrid } from './fit.ts';
import { solveStackLayout } from './layout.ts';
import { scoreComposition } from './compose.ts';
import { analyzeTargetAcquisition, predictFittsTime, predictHickTime, predictSteeringTime } from './interaction.ts';
import { getCorrections } from './optical.ts';
import { generateGlassCss } from './glass.ts';

describe('geometry inputs', () => {
  it('rejects finite coordinates whose drift or composition moments overflow', () => {
    const left = { id: 'box', x: Number.MAX_VALUE, y: 0, width: 1, height: 1 };
    const right = { ...left, x: -Number.MAX_VALUE };
    expect(() => verifyPlanFit([left], [right])).toThrow();
    expect(() => scoreComposition([{ ...left, x: 1e154, width: 1e154, height: 1e154 }], { width: 1e154, height: 1e154 })).toThrow();
  });
  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('rejects invalid rectangle dimensions %s instead of generating a fit score', (width) => {
    const item = { id: 'box', x: 0, y: 0, width, height: 40 };
    expect(() => verifyContainment({ width: 320, height: 200 }, [item])).toThrow();
    expect(() => verifyPlanFit([item], [item])).toThrow();
    expect(() => scoreComposition([item], { width: 320, height: 200 })).toThrow();
  });

  it('rejects duplicate measurement identities instead of selecting the last matching rectangle', () => {
    const item = { id: 'box', x: 0, y: 0, width: 40, height: 40 };
    expect(() => verifyPlanFit([item], [item, { ...item, x: 100 }])).toThrow();
  });

  it.each([
    { min: 100, preferred: 120, max: 20 },
    { min: 0, preferred: 120, grow: Number.NaN },
    { min: 0, preferred: 120, shrink: -1 },
    { min: -1, preferred: 120 }
  ])('rejects inconsistent stack constraints %j', (item) => {
    expect(() => solveStackLayout([{ id: 'box', ...item }], { container: 320 })).toThrow();
  });

  it('keeps clamping a preferred size and supports an omitted maximum', () => {
    const result = solveStackLayout([{ id: 'box', min: 40, preferred: 20 }], { container: 100 });
    expect(result.items[0].size).toBe(100);
    expect(Number.isFinite(result.metrics.used)).toBe(true);
  });

  it('rejects invalid grid counts without iterating through an unbounded count', () => {
    expect(() => recommendMetricGrid(320, Number.NaN)).toThrow();
    expect(() => recommendMetricGrid(320, -1)).toThrow();
    expect(recommendMetricGrid(320, 1e9).columns).toBe(2);
  });
});

describe('physical CSS and interaction inputs', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid optical sizes %s', (size) => {
    expect(() => getCorrections('circle', size)).toThrow();
  });
  it.each([{ blur: -1 }, { radius: -1 }, { opacity: Number.NaN }, { layers: 1.5 }, { blur: Number.MAX_VALUE, layers: 3 }])('rejects invalid glass parameters %j', (params) => {
    expect(() => generateGlassCss(params)).toThrow();
  });
  it('rejects physically invalid targeting inputs before touch width correction can hide them', () => {
    expect(() => analyzeTargetAcquisition({ distance: 100, width: -10, choices: 3, modality: 'touch' })).toThrow();
    expect(() => predictFittsTime({ distance: -100, width: 40 })).toThrow();
    expect(() => predictHickTime({ choices: 1.5 })).toThrow();
    expect(() => predictSteeringTime({ length: 100, width: 0 })).toThrow();
  });
});
