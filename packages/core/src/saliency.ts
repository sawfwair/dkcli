import type { DesignDocument, DesignElement, DesignRole } from './design.ts';
import {
  area,
  center,
  clamp01,
  intersectionArea,
  manhattanDistance,
  round,
  type ImportanceMode,
  type RectLike
} from './types.ts';

export type ImportanceItem = {
  id: string;
  score: number;
  normalized: number;
  reasons: string[];
  relationHints: string[];
};

export type ImportanceReport = {
  mode: ImportanceMode;
  focusRegions: RectLike[];
  elements: ImportanceItem[];
};

const ROLE_WEIGHTS: Record<DesignRole, number> = {
  hero: 1,
  title: 0.92,
  cta: 0.9,
  image: 0.82,
  eyebrow: 0.72,
  body: 0.64,
  data: 0.62,
  support: 0.48,
  caption: 0.42,
  meta: 0.34
};

function roleWeight(role?: DesignRole): number {
  return role ? ROLE_WEIGHTS[role] : 0.5;
}

function contrastHint(element: DesignElement, backgroundColor: string | undefined): number {
  const ownBackground = element.background ?? backgroundColor;
  if (!element.color || !ownBackground) {
    return 0.45;
  }
  const fg = element.color.toLowerCase();
  const bg = ownBackground.toLowerCase();
  return fg === bg ? 0.08 : 0.78;
}

function edgeDensity(element: DesignElement, doc: DesignDocument): number {
  const frameArea = Math.max(doc.frame.width * doc.frame.height, 1);
  const density = Math.sqrt(area(element) / frameArea);
  const subjectBoost = doc.background?.subjectRegion
    ? intersectionArea(element, doc.background.subjectRegion) / Math.max(area(element), 1)
    : 0;
  return clamp01(density * 0.85 + subjectBoost * 0.7);
}

function spatialWeight(element: DesignElement, doc: DesignDocument): number {
  const elementCenter = center(element);
  const frameCenter = { x: doc.frame.width / 2, y: doc.frame.height / 2 };
  const maxDistance = Math.max(doc.frame.width + doc.frame.height, 1);
  const distance = manhattanDistance(elementCenter, frameCenter) / maxDistance;
  return 1 - distance;
}

function relationHints(elements: DesignElement[], current: DesignElement): string[] {
  const hints = new Set<string>();
  for (const other of elements) {
    if (other.id === current.id) {
      continue;
    }
    if (Math.abs(other.x - current.x) <= 8) {
      hints.add(`align-left:${other.id}`);
    }
    if (Math.abs(other.y - current.y) <= 16) {
      hints.add(`same-row:${other.id}`);
    }
    if (Math.abs(other.x + other.width - (current.x + current.width)) <= 8) {
      hints.add(`align-right:${other.id}`);
    }
  }
  return [...hints].slice(0, 4);
}

export function analyzeImportance(
  document: DesignDocument,
  mode: ImportanceMode = 'heuristic'
): ImportanceReport {
  const frameArea = Math.max(document.frame.width * document.frame.height, 1);
  const focusRegions: RectLike[] = [];
  if (document.background?.subjectRegion) {
    focusRegions.push(document.background.subjectRegion);
  }
  if (document.background?.safeRegions) {
    focusRegions.push(...document.background.safeRegions);
  }

  const raw = document.elements.map((element) => {
    const normalizedArea = Math.sqrt(area(element) / frameArea);
    const role = roleWeight(element.role);
    const contrast = contrastHint(element, document.background?.dominantColor);
    const spatial = spatialWeight(element, document);
    const density = edgeDensity(element, document);
    const explicit = clamp01(element.importance ?? 0.5);
    const score = clamp01(
      role * 0.26 +
        normalizedArea * 0.24 +
        contrast * 0.16 +
        spatial * 0.14 +
        density * 0.1 +
        explicit * 0.1
    );

    const reasons = [
      `role:${element.role ?? 'unspecified'}`,
      `area:${round(normalizedArea, 3)}`,
      `contrast:${round(contrast, 3)}`,
      `spatial:${round(spatial, 3)}`
    ];
    if (density > 0.58) {
      reasons.push(`edge-density:${round(density, 3)}`);
    }

    return {
      id: element.id,
      score,
      reasons,
      relationHints: relationHints(document.elements, element)
    };
  });

  const total = raw.reduce((sum, item) => sum + item.score, 0) || 1;
  const elements = raw
    .map((item) => ({
      ...item,
      score: round(item.score, 4),
      normalized: round(item.score / total, 4)
    }))
    .sort((left, right) => right.score - left.score);

  return {
    mode,
    focusRegions,
    elements
  };
}
