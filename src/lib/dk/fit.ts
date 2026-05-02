// Fit — Render-truth verification for containment and planned-vs-rendered layout drift

export type FitRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FitFrame = {
  width: number;
  height: number;
};

export type ContainmentOptions = {
  overflowTolerance?: number;
};

export type ContainmentItem = FitRect & {
  overflowLeft: number;
  overflowRight: number;
  overflowTop: number;
  overflowBottom: number;
  overflowX: number;
  overflowY: number;
  contained: boolean;
};

export type ContainmentMetrics = {
  itemCount: number;
  overflowCount: number;
  maxOverflowX: number;
  maxOverflowY: number;
  totalOverflow: number;
  score: number;
};

export type ContainmentReport = {
  frame: FitFrame;
  items: ContainmentItem[];
  metrics: ContainmentMetrics;
};

export type PlanFitOptions = {
  positionTolerance?: number;
  sizeTolerance?: number;
};

export type PlanFitItem = {
  id: string;
  expected: FitRect;
  actual: FitRect;
  deltaX: number;
  deltaY: number;
  deltaWidth: number;
  deltaHeight: number;
  drift: number;
  withinTolerance: boolean;
};

export type PlanFitMetrics = {
  matched: number;
  missing: string[];
  mismatchCount: number;
  meanDrift: number;
  maxDrift: number;
  score: number;
};

export type PlanFitReport = {
  items: PlanFitItem[];
  metrics: PlanFitMetrics;
};

export type MetricGridOptions = {
  gap?: number;
  minCellWidth?: number;
  compactThreshold?: number;
  maxColumns?: number;
};

export type MetricGridRecommendation = {
  columns: number;
  cellWidth: number;
  compact: boolean;
};

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function round(value: number): number {
  return parseFloat(value.toFixed(2));
}

export function verifyContainment(
  frame: FitFrame,
  items: FitRect[],
  options: ContainmentOptions = {}
): ContainmentReport {
  const tolerance = options.overflowTolerance ?? 0;

  const evaluated = items.map((item) => {
    const overflowLeft = Math.max(0, 0 - item.x);
    const overflowRight = Math.max(0, item.x + item.width - frame.width);
    const overflowTop = Math.max(0, 0 - item.y);
    const overflowBottom = Math.max(0, item.y + item.height - frame.height);
    const overflowX = overflowLeft + overflowRight;
    const overflowY = overflowTop + overflowBottom;
    return {
      ...item,
      overflowLeft: round(overflowLeft),
      overflowRight: round(overflowRight),
      overflowTop: round(overflowTop),
      overflowBottom: round(overflowBottom),
      overflowX: round(overflowX),
      overflowY: round(overflowY),
      contained: overflowX <= tolerance && overflowY <= tolerance
    };
  });

  const overflowCount = evaluated.filter((item) => !item.contained).length;
  const maxOverflowX = Math.max(0, ...evaluated.map((item) => item.overflowX));
  const maxOverflowY = Math.max(0, ...evaluated.map((item) => item.overflowY));
  const totalOverflow = evaluated.reduce((sum, item) => sum + item.overflowX + item.overflowY, 0);
  const normalizer = Math.max(frame.width + frame.height, 1) * Math.max(evaluated.length, 1);
  const score = Math.round(clamp01(1 - totalOverflow / normalizer) * 100);

  return {
    frame,
    items: evaluated,
    metrics: {
      itemCount: evaluated.length,
      overflowCount,
      maxOverflowX: round(maxOverflowX),
      maxOverflowY: round(maxOverflowY),
      totalOverflow: round(totalOverflow),
      score
    }
  };
}

export function verifyPlanFit(
  expected: FitRect[],
  actual: FitRect[],
  options: PlanFitOptions = {}
): PlanFitReport {
  const positionTolerance = options.positionTolerance ?? 2;
  const sizeTolerance = options.sizeTolerance ?? 2;
  const actualById = new Map(actual.map((item) => [item.id, item]));
  const missing: string[] = [];

  const items = expected.flatMap((target) => {
    const measured = actualById.get(target.id);
    if (!measured) {
      missing.push(target.id);
      return [];
    }

    const deltaX = measured.x - target.x;
    const deltaY = measured.y - target.y;
    const deltaWidth = measured.width - target.width;
    const deltaHeight = measured.height - target.height;
    const drift = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaWidth ** 2 + deltaHeight ** 2);
    const withinTolerance =
      Math.abs(deltaX) <= positionTolerance &&
      Math.abs(deltaY) <= positionTolerance &&
      Math.abs(deltaWidth) <= sizeTolerance &&
      Math.abs(deltaHeight) <= sizeTolerance;

    return [
      {
        id: target.id,
        expected: target,
        actual: measured,
        deltaX: round(deltaX),
        deltaY: round(deltaY),
        deltaWidth: round(deltaWidth),
        deltaHeight: round(deltaHeight),
        drift: round(drift),
        withinTolerance
      }
    ];
  });

  const mismatchCount = items.filter((item) => !item.withinTolerance).length;
  const totalDrift = items.reduce((sum, item) => sum + item.drift, 0);
  const meanDrift = items.length > 0 ? totalDrift / items.length : 0;
  const maxDrift = Math.max(0, ...items.map((item) => item.drift));
  const maxSpan = Math.max(
    1,
    ...expected.map((item) => Math.max(item.width, item.height)),
    ...actual.map((item) => Math.max(item.width, item.height))
  );
  const driftPenalty = meanDrift / maxSpan;
  const missingPenalty = missing.length / Math.max(expected.length, 1);
  const mismatchPenalty = mismatchCount / Math.max(items.length, 1);
  const score = Math.round(clamp01(1 - driftPenalty - missingPenalty * 0.5 - mismatchPenalty * 0.15) * 100);

  return {
    items,
    metrics: {
      matched: items.length,
      missing,
      mismatchCount,
      meanDrift: round(meanDrift),
      maxDrift: round(maxDrift),
      score
    }
  };
}

export function recommendMetricGrid(
  containerWidth: number,
  itemCount: number,
  options: MetricGridOptions = {}
): MetricGridRecommendation {
  const gap = options.gap ?? 12;
  const minCellWidth = options.minCellWidth ?? 112;
  const compactThreshold = options.compactThreshold ?? 132;
  const maxColumns = Math.max(1, Math.min(options.maxColumns ?? itemCount, itemCount));

  let columns = maxColumns;
  while (columns > 1) {
    const width = (containerWidth - gap * (columns - 1)) / columns;
    if (width >= minCellWidth) {
      break;
    }
    columns -= 1;
  }

  const safeColumns = Math.max(1, columns);
  const cellWidth = Math.max(0, (containerWidth - gap * (safeColumns - 1)) / safeColumns);

  return {
    columns: safeColumns,
    cellWidth: round(cellWidth),
    compact: cellWidth < compactThreshold
  };
}
