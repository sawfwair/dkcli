// Compose — Layout composition scoring inspired by computable aesthetics work.

import type { DesignDocument } from './design.ts';
import { analyzeImportance, type ImportanceReport } from './saliency.ts';
import { area, center, round } from './types.ts';

export type Rect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Frame = {
  width: number;
  height: number;
};

export type CompositionMetrics = {
  balance: number;
  symmetry: number;
  alignment: number;
  rhythm: number;
  density: number;
  simplicity: number;
  order: number;
};

export type CompositionScore = {
  frame: Frame;
  metrics: CompositionMetrics;
  total: number;
};

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function normalizeScore(value: number): number {
  return parseFloat(clamp01(value).toFixed(3));
}

function uniqueRounded(values: number[], precision: number = 4): number[] {
  const rounded = values.map((value) => value.toFixed(precision));
  return [...new Set(rounded)].map(Number);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const avg = mean(values);
  return mean(values.map((value) => (value - avg) ** 2));
}

function gapSeries(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    gaps.push(sorted[index] - sorted[index - 1]);
  }
  return gaps;
}

export function scoreComposition(rects: Rect[], frame: Frame): CompositionScore {
  const centerX = frame.width / 2;
  const centerY = frame.height / 2;
  const totalArea = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  const frameArea = Math.max(frame.width * frame.height, 1);

  const horizontalMoment = rects.reduce((sum, rect) => {
    const area = rect.width * rect.height;
    const dx = rect.x + rect.width / 2 - centerX;
    return sum + area * dx;
  }, 0);
  const verticalMoment = rects.reduce((sum, rect) => {
    const area = rect.width * rect.height;
    const dy = rect.y + rect.height / 2 - centerY;
    return sum + area * dy;
  }, 0);
  const maxHorizontalMoment = Math.max(totalArea * centerX, 1);
  const maxVerticalMoment = Math.max(totalArea * centerY, 1);
  const balance = normalizeScore(
    1 - (Math.abs(horizontalMoment) / maxHorizontalMoment + Math.abs(verticalMoment) / maxVerticalMoment) / 2
  );

  const quadrants = { tl: 0, tr: 0, bl: 0, br: 0 };
  for (const rect of rects) {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const area = rect.width * rect.height;
    if (cx <= centerX && cy <= centerY) quadrants.tl += area;
    if (cx > centerX && cy <= centerY) quadrants.tr += area;
    if (cx <= centerX && cy > centerY) quadrants.bl += area;
    if (cx > centerX && cy > centerY) quadrants.br += area;
  }
  const totalQuadrantArea = Math.max(totalArea, 1);
  const symmetry = normalizeScore(
    1 -
      (
        Math.abs(quadrants.tl - quadrants.tr) / totalQuadrantArea +
        Math.abs(quadrants.bl - quadrants.br) / totalQuadrantArea +
        Math.abs(quadrants.tl - quadrants.bl) / totalQuadrantArea +
        Math.abs(quadrants.tr - quadrants.br) / totalQuadrantArea
      ) /
        4
  );

  const tolerance = 8;
  let alignedPairs = 0;
  let totalPairs = 0;
  for (let index = 0; index < rects.length; index += 1) {
    const a = rects[index];
    const ax = [a.x, a.x + a.width / 2, a.x + a.width];
    const ay = [a.y, a.y + a.height / 2, a.y + a.height];
    for (let inner = index + 1; inner < rects.length; inner += 1) {
      const b = rects[inner];
      const bx = [b.x, b.x + b.width / 2, b.x + b.width];
      const by = [b.y, b.y + b.height / 2, b.y + b.height];
      const sharesAxis =
        ax.some((value) => bx.some((other) => Math.abs(value - other) <= tolerance)) ||
        ay.some((value) => by.some((other) => Math.abs(value - other) <= tolerance));
      totalPairs += 1;
      if (sharesAxis) {
        alignedPairs += 1;
      }
    }
  }
  const alignment = normalizeScore(totalPairs > 0 ? alignedPairs / totalPairs : 1);

  const rhythmInputs = [
    ...gapSeries(rects.map((rect) => rect.x)),
    ...gapSeries(rects.map((rect) => rect.y)),
    ...gapSeries(rects.map((rect) => rect.width)),
    ...gapSeries(rects.map((rect) => rect.height))
  ].filter((value) => value > 0);
  const rhythmVariance = variance(rhythmInputs);
  const rhythmMean = mean(rhythmInputs);
  const rhythm = normalizeScore(rhythmMean > 0 ? 1 / (1 + rhythmVariance / rhythmMean ** 2) : 1);

  const densityRatio = totalArea / frameArea;
  const density = normalizeScore(1 - Math.abs(densityRatio - 0.55) / 0.55);

  const distinctMeasures =
    uniqueRounded(rects.map((rect) => rect.width)).length +
    uniqueRounded(rects.map((rect) => rect.height)).length +
    uniqueRounded(rects.map((rect) => rect.x)).length +
    uniqueRounded(rects.map((rect) => rect.y)).length;
  const maxDistinct = Math.max(rects.length * 4, 1);
  const simplicity = normalizeScore(1 - (distinctMeasures - 4) / maxDistinct);

  const order = normalizeScore(mean([balance, symmetry, alignment, rhythm, density, simplicity]));
  return {
    frame,
    metrics: {
      balance,
      symmetry,
      alignment,
      rhythm,
      density,
      simplicity,
      order
    },
    total: Math.round(order * 100)
  };
}

export type AdvancedCompositionMetrics = CompositionMetrics & {
  weightedBalance: number;
  hierarchy: number;
  saliencyRespect: number;
};

export type AdvancedCompositionScore = {
  frame: Frame;
  metrics: AdvancedCompositionMetrics;
  total: number;
};

export function scoreDesignComposition(
  document: DesignDocument,
  importanceReport?: ImportanceReport
): AdvancedCompositionScore {
  const rects = document.elements.map((element) => ({
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height
  }));
  const base = scoreComposition(rects, document.frame);
  const importance = importanceReport ?? analyzeImportance(document, 'heuristic');
  const importanceById = new Map(importance.elements.map((element) => [element.id, element.normalized]));
  const frameCenter = { x: document.frame.width / 2, y: document.frame.height / 2 };
  const totalWeight = importance.elements.reduce((sum, item) => sum + item.normalized, 0) || 1;

  const weightedMoment = document.elements.reduce((sum, element) => {
    const weight = importanceById.get(element.id) ?? 0;
    const elementCenter = center(element);
    const distance =
      Math.abs(elementCenter.x - frameCenter.x) / Math.max(document.frame.width, 1) +
      Math.abs(elementCenter.y - frameCenter.y) / Math.max(document.frame.height, 1);
    return sum + weight * distance;
  }, 0);
  const weightedBalance = normalizeScore(1 - weightedMoment / totalWeight);

  const ordered = [...document.elements].sort((left, right) => right.y - left.y);
  const hierarchyDelta = ordered.reduce((sum, element, index) => {
    if (index === 0) {
      return sum;
    }
    const current = importanceById.get(element.id) ?? 0;
    const previous = importanceById.get(ordered[index - 1].id) ?? 0;
    return sum + Math.max(0, current - previous);
  }, 0);
  const hierarchy = normalizeScore(1 - hierarchyDelta);

  const subjectRegion = document.background?.subjectRegion;
  const salientOverlap = subjectRegion
    ? document.elements.reduce((sum, element) => {
        const overlapX = Math.max(
          0,
          Math.min(element.x + element.width, subjectRegion.x + subjectRegion.width) -
            Math.max(element.x, subjectRegion.x)
        );
        const overlapY = Math.max(
          0,
          Math.min(element.y + element.height, subjectRegion.y + subjectRegion.height) -
            Math.max(element.y, subjectRegion.y)
        );
        const overlap = overlapX * overlapY;
        const weight = importanceById.get(element.id) ?? 0;
        return sum + weight * overlap / Math.max(area(element), 1);
      }, 0)
    : 0;
  const saliencyRespect = normalizeScore(1 - salientOverlap);

  const total = Math.round(
    clamp01(
      base.metrics.order * 0.46 + weightedBalance * 0.2 + hierarchy * 0.18 + saliencyRespect * 0.16
    ) * 100
  );

  return {
    frame: document.frame,
    metrics: {
      ...base.metrics,
      weightedBalance: round(weightedBalance, 3),
      hierarchy: round(hierarchy, 3),
      saliencyRespect: round(saliencyRespect, 3)
    },
    total
  };
}
