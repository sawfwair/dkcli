import type { DesignDocument } from './design.ts';
import { type ImportanceMode, type RectLike } from './types.ts';
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
/** Estimates element importance from document geometry and metadata. */
export declare function analyzeImportance(document: DesignDocument, mode?: ImportanceMode): ImportanceReport;
