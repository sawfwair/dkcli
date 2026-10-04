import { type ImportanceReport } from './saliency.ts';
import type { DesignDocument, LayoutObjectiveReport } from './design.ts';
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
/** Distributes stack space using item size constraints, growth, and shrink weights. */
export declare function solveStackLayout(items: LayoutItem[], options: LayoutSolveOptions): LayoutResult;
/** Computes estimated element rectangles from a design document and layout heuristics. */
export declare function solveDesignLayout(document: DesignDocument, options?: {
    importanceReport?: ImportanceReport;
    preservePositions?: boolean;
}): LayoutObjectiveReport;
