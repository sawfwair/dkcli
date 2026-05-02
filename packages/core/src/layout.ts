// Layout — Constraint-style stack layout solving plus advanced design-document layout.

import { analyzeImportance, type ImportanceReport } from './saliency.ts';
import type { DesignDocument, LayoutObjectiveElement, LayoutObjectiveReport } from './design.ts';
import { area, center, clamp01, intersectionArea, intersects, round, type RectLike } from './types.ts';

export type LayoutItem = {
  id: string;
  min: number;
  preferred: number;
  max?: number;
  grow?: number;
  shrink?: number;
};

export type LayoutSolveOptions = {
  container: number;
  gap?: number;
  padding?: number;
  align?: 'start' | 'center' | 'end';
};

export type SolvedLayoutItem = LayoutItem & {
  size: number;
  start: number;
  end: number;
  delta: number;
  clamped: boolean;
};

export type LayoutMetrics = {
  available: number;
  preferredTotal: number;
  used: number;
  free: number;
  overflow: number;
  compression: number;
};

export type LayoutResult = {
  items: SolvedLayoutItem[];
  metrics: LayoutMetrics;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolvedMax(item: LayoutItem): number {
  return item.max ?? Number.POSITIVE_INFINITY;
}

function distributeExtra(items: SolvedLayoutItem[], extra: number): number {
  let remaining = extra;
  for (let iteration = 0; iteration < items.length * 3 && remaining > 0.001; iteration += 1) {
    const growable = items.filter((item) => item.size < resolvedMax(item) - 0.001);
    const totalWeight = growable.reduce((sum, item) => sum + (item.grow ?? 1), 0);
    if (growable.length === 0 || totalWeight <= 0) {
      break;
    }

    let distributed = 0;
    for (const item of growable) {
      const weight = item.grow ?? 1;
      const share = remaining * (weight / totalWeight);
      const nextSize = clamp(item.size + share, item.min, resolvedMax(item));
      const delta = nextSize - item.size;
      item.size = nextSize;
      distributed += delta;
    }

    if (distributed <= 0.001) {
      break;
    }
    remaining -= distributed;
  }
  return remaining;
}

function distributeDeficit(items: SolvedLayoutItem[], deficit: number): number {
  let remaining = deficit;
  for (let iteration = 0; iteration < items.length * 3 && remaining > 0.001; iteration += 1) {
    const shrinkable = items.filter((item) => item.size > item.min + 0.001);
    const totalWeight = shrinkable.reduce((sum, item) => sum + (item.shrink ?? 1), 0);
    if (shrinkable.length === 0 || totalWeight <= 0) {
      break;
    }

    let reduced = 0;
    for (const item of shrinkable) {
      const weight = item.shrink ?? 1;
      const share = remaining * (weight / totalWeight);
      const nextSize = clamp(item.size - share, item.min, resolvedMax(item));
      const delta = item.size - nextSize;
      item.size = nextSize;
      reduced += delta;
    }

    if (reduced <= 0.001) {
      break;
    }
    remaining -= reduced;
  }
  return remaining;
}

export function solveStackLayout(items: LayoutItem[], options: LayoutSolveOptions): LayoutResult {
  const gap = options.gap ?? 0;
  const padding = options.padding ?? 0;
  const align = options.align ?? 'start';
  const available = Math.max(0, options.container - padding * 2 - Math.max(0, items.length - 1) * gap);

  const solved: SolvedLayoutItem[] = items.map((item) => {
    const max = resolvedMax(item);
    const size = clamp(item.preferred, item.min, max);
    return {
      ...item,
      size,
      start: 0,
      end: 0,
      delta: 0,
      clamped: size !== item.preferred
    };
  });

  const preferredTotal = solved.reduce((sum, item) => sum + item.size, 0);
  if (preferredTotal < available) {
    distributeExtra(solved, available - preferredTotal);
  } else if (preferredTotal > available) {
    distributeDeficit(solved, preferredTotal - available);
  }

  const contentUsed = solved.reduce((sum, item) => sum + item.size, 0);
  const totalUsed = contentUsed + padding * 2 + Math.max(0, items.length - 1) * gap;
  const free = Math.max(0, options.container - totalUsed);
  const overflow = Math.max(0, totalUsed - options.container);

  let cursor = padding;
  if (free > 0 && align === 'center') {
    cursor += free / 2;
  } else if (free > 0 && align === 'end') {
    cursor += free;
  }

  for (const item of solved) {
    item.start = parseFloat(cursor.toFixed(2));
    item.end = parseFloat((cursor + item.size).toFixed(2));
    item.delta = parseFloat((item.size - item.preferred).toFixed(2));
    item.clamped = item.clamped || item.size <= item.min + 0.001 || item.size >= resolvedMax(item) - 0.001;
    cursor += item.size + gap;
  }

  return {
    items: solved,
    metrics: {
      available: parseFloat(available.toFixed(2)),
      preferredTotal: parseFloat(preferredTotal.toFixed(2)),
      used: parseFloat(totalUsed.toFixed(2)),
      free: parseFloat(free.toFixed(2)),
      overflow: parseFloat(overflow.toFixed(2)),
      compression: available > 0 ? parseFloat((contentUsed / available).toFixed(3)) : 1
    }
  };
}

function snap(value: number, grid: number = 8): number {
  return Math.round(value / grid) * grid;
}

function roleRank(role: string | undefined): number {
  switch (role) {
    case 'hero':
      return 0;
    case 'title':
      return 1;
    case 'cta':
      return 2;
    case 'image':
      return 3;
    case 'body':
      return 4;
    case 'support':
      return 5;
    case 'caption':
      return 6;
    default:
      return 7;
  }
}

function collisionCount(rect: RectLike, others: RectLike[]): number {
  return others.filter((other) => intersects(rect, other)).length;
}

function avoidPenalty(rect: RectLike, regions: RectLike[]): number {
  return regions.reduce((sum, region) => sum + intersectionArea(rect, region), 0);
}

function shouldPreserveElement(
  document: DesignDocument,
  element: DesignDocument['elements'][number],
  options: { preservePositions?: boolean }
): boolean {
  return options.preservePositions || element.locked || document.frame.mode === 'app-shell';
}

export function solveDesignLayout(
  document: DesignDocument,
  options: {
    importanceReport?: ImportanceReport;
    preservePositions?: boolean;
  } = {}
): LayoutObjectiveReport {
  const padding = document.frame.padding ?? 32;
  const gap = document.frame.gap ?? 20;
  const columns = Math.max(1, document.frame.columns ?? 12);
  const columnWidth = (document.frame.width - padding * 2 - gap * (columns - 1)) / columns;
  const avoidRegions = [
    ...(document.background?.safeRegions ?? []),
    ...(document.background?.subjectRegion ? [document.background.subjectRegion] : [])
  ];
  const importanceReport = options.importanceReport ?? analyzeImportance(document, 'heuristic');
  const importanceById = new Map(importanceReport.elements.map((element) => [element.id, element.normalized]));

  const placed: LayoutObjectiveElement[] = [];
  let cursorY = padding;
  const ordered = [...document.elements].sort((left, right) => {
    const leftPreserved = shouldPreserveElement(document, left, options) ? 1 : 0;
    const rightPreserved = shouldPreserveElement(document, right, options) ? 1 : 0;
    return (
      rightPreserved - leftPreserved ||
      roleRank(left.role) - roleRank(right.role) ||
      (right.priority ?? 0) - (left.priority ?? 0)
    );
  });

  for (const element of ordered) {
    const preserve = shouldPreserveElement(document, element, options);
    const preferredWidth = element.preferredWidth ?? element.width;
    const preferredHeight = element.preferredHeight ?? element.height;
    const width = preserve
      ? Math.min(element.width, document.frame.width)
      : snap(
          Math.min(
            element.maxWidth ?? preferredWidth,
            Math.max(element.minWidth ?? Math.min(preferredWidth, columnWidth * 3), preferredWidth)
          )
        );
    const height = preserve
      ? Math.min(element.height, document.frame.height)
      : snap(
          Math.min(
            element.maxHeight ?? preferredHeight,
            Math.max(element.minHeight ?? Math.min(preferredHeight, 64), preferredHeight)
          )
        );

    let x = preserve ? element.x : element.x || padding;
    let y = preserve ? element.y : element.y || cursorY;

    if (preserve) {
      x = Math.min(Math.max(x, 0), document.frame.width - width);
      y = Math.min(Math.max(y, 0), document.frame.height - height);
    } else {
      x = snap(Math.min(Math.max(x, padding), document.frame.width - padding - width));
      y = snap(Math.max(y, padding));
    }

    let best: RectLike = { x, y, width, height };
    if (!preserve) {
      const candidates: RectLike[] = [
        best,
        { x: padding, y, width, height },
        { x: document.frame.width - padding - width, y, width, height },
        { x: padding, y: cursorY, width, height },
        { x: snap(padding + columnWidth * 4), y, width, height },
        { x: snap(padding + columnWidth * 7), y, width, height }
      ].map((candidate) => ({
        ...candidate,
        x: Math.min(Math.max(candidate.x, padding), document.frame.width - padding - width),
        y: Math.min(Math.max(candidate.y, padding), document.frame.height - padding - height)
      }));

      best = candidates[0];
      let bestScore = Number.POSITIVE_INFINITY;
      for (const candidate of candidates) {
        const overlap = placed.reduce((sum, other) => sum + intersectionArea(candidate, other), 0);
        const avoid = avoidPenalty(candidate, avoidRegions);
        const anchorDistance = Math.abs(candidate.y - y) + Math.abs(candidate.x - x);
        const score = overlap * 10 + avoid * 14 + anchorDistance;
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
    }

    const laidOut: LayoutObjectiveElement = {
      ...element,
      ...best,
      collisions: collisionCount(best, placed),
      importance: importanceById.get(element.id) ?? 0
    };
    placed.push(laidOut);
    cursorY = Math.max(cursorY, laidOut.y + laidOut.height + gap);
  }

  const overlapPenalty = placed.reduce((sum, item, index) => {
    return (
      sum +
      placed.slice(index + 1).reduce((inner, other) => inner + intersectionArea(item, other), 0)
    );
  }, 0);
  const safeRegionPenalty = placed.reduce((sum, item) => sum + avoidPenalty(item, avoidRegions), 0);
  const alignmentMatches: number[] = placed.flatMap((item, index) =>
    placed.slice(index + 1).map((other) => {
      const aligned =
        Math.abs(item.x - other.x) <= 8 ||
        Math.abs(item.x + item.width - (other.x + other.width)) <= 8 ||
        Math.abs(center(item).x - center(other).x) <= 8;
      return Number(aligned);
    })
  );
  const alignment =
    alignmentMatches.length > 0
      ? alignmentMatches.reduce((sum, value) => sum + value, 0) / alignmentMatches.length
      : 1;
  const usedArea = placed.reduce((sum, item) => sum + area(item), 0);
  const whitespace = clamp01(1 - usedArea / Math.max(document.frame.width * document.frame.height, 1));
  const hierarchy =
    placed.length > 1
      ? clamp01(
          1 -
            placed.reduce((sum, item, index, source) => {
              if (index === source.length - 1) {
                return sum;
              }
              return sum + Math.max(0, source[index + 1].importance - item.importance);
            }, 0)
        )
      : 1;
  const total = Math.round(
    clamp01(
      alignment * 0.26 +
        whitespace * 0.18 +
        hierarchy * 0.18 +
        (1 - Math.min(overlapPenalty / 6000, 1)) * 0.2 +
        (1 - Math.min(safeRegionPenalty / 6000, 1)) * 0.18
    ) * 100
  );

  return {
    frame: document.frame,
    elements: placed,
    avoidedRegions: avoidRegions,
    metrics: {
      overlapPenalty: round(overlapPenalty),
      safeRegionPenalty: round(safeRegionPenalty),
      alignment: round(alignment, 3),
      whitespace: round(whitespace, 3),
      hierarchy: round(hierarchy, 3),
      total
    }
  };
}
