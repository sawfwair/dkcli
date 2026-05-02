import type { RectLike } from './types.ts';
export type DesignElementKind = 'text' | 'image' | 'shape' | 'group';
export type DesignRole = 'hero' | 'title' | 'body' | 'caption' | 'cta' | 'support' | 'meta' | 'eyebrow' | 'image' | 'data';
export type BackgroundAsset = {
    src?: string;
    focalPoint?: {
        x: number;
        y: number;
    };
    subjectRegion?: RectLike;
    safeRegions?: RectLike[];
    dominantColor?: string;
};
export type DesignElement = RectLike & {
    id: string;
    kind: DesignElementKind;
    role?: DesignRole;
    text?: string;
    color?: string;
    background?: string;
    fontSize?: number;
    fontWeight?: number;
    minWidth?: number;
    preferredWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    preferredHeight?: number;
    maxHeight?: number;
    priority?: number;
    importance?: number;
    locked?: boolean;
};
export type DesignDocument = {
    frame: {
        width: number;
        height: number;
        padding?: number;
        gap?: number;
        columns?: number;
        mode?: 'flow' | 'app-shell';
    };
    background?: BackgroundAsset;
    elements: DesignElement[];
    tokens?: Record<string, string | number>;
};
export type LayoutObjectiveMetrics = {
    overlapPenalty: number;
    safeRegionPenalty: number;
    alignment: number;
    whitespace: number;
    hierarchy: number;
    total: number;
};
export type LayoutObjectiveElement = DesignElement & {
    collisions: number;
    importance: number;
};
export type LayoutObjectiveReport = {
    frame: DesignDocument['frame'];
    elements: LayoutObjectiveElement[];
    avoidedRegions: RectLike[];
    metrics: LayoutObjectiveMetrics;
};
