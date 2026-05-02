export type EngineMode = 'basic' | 'advanced' | 'auto';
export type WhiteSpaceMode = 'normal' | 'pre-wrap';

export type ColorSpace = 'oklch' | 'cam16-ucs' | 'jzazbz';

export type Gamut = 'srgb' | 'p3' | 'hdr';

export type CvdModel = 'simple' | 'machado';

export type ImportanceMode = 'heuristic' | 'ml' | 'auto';

export type TargetModality = 'mouse' | 'touch';

export type RectLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PointLike = {
  x: number;
  y: number;
};

export function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function round(value: number, digits: number = 2): number {
  return parseFloat(value.toFixed(digits));
}

export function area(rect: RectLike): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

export function center(rect: RectLike): PointLike {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

export function intersects(left: RectLike, right: RectLike): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

export function intersectionArea(left: RectLike, right: RectLike): number {
  const x = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const y = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
  return x * y;
}

export function manhattanDistance(left: PointLike, right: PointLike): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}
