import type { DesignDocument } from './design.ts';
import { type ImportanceReport } from './saliency.ts';
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
export declare function scoreComposition(rects: Rect[], frame: Frame): CompositionScore;
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
export declare function scoreDesignComposition(document: DesignDocument, importanceReport?: ImportanceReport): AdvancedCompositionScore;
