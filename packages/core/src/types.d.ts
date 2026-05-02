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
export declare function clamp01(value: number): number;
export declare function round(value: number, digits?: number): number;
export declare function area(rect: RectLike): number;
export declare function center(rect: RectLike): PointLike;
export declare function intersects(left: RectLike, right: RectLike): boolean;
export declare function intersectionArea(left: RectLike, right: RectLike): number;
export declare function manhattanDistance(left: PointLike, right: PointLike): number;
