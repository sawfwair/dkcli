import { futureSimilarityBand, type FutureEmbeddingModel } from './future.ts';
import { type PrepareTypesetOptions, type TypesetResult } from './typeset.ts';
export type SemanticUnitKind = 'sentence' | 'clause';
export type SemanticTypesetVariantId = 'advanced' | 'syntax' | 'semantic';
export type SemanticParagraphUnit = {
    id: string;
    kind: SemanticUnitKind;
    text: string;
};
export type SemanticSentenceShift = {
    left: string;
    right: string;
    similarity: number;
    band: ReturnType<typeof futureSimilarityBand>;
};
export type SemanticTypesetVariant = {
    id: SemanticTypesetVariantId;
    label: string;
    result: TypesetResult;
    deltaBadness: number;
    notes: string[];
};
export type SemanticTypesetReport = {
    mode: 'heuristic' | 'ml';
    model: FutureEmbeddingModel;
    warnings: string[];
    units: {
        sentences: SemanticParagraphUnit[];
        clauses: SemanticParagraphUnit[];
    };
    shifts: SemanticSentenceShift[];
    variants: SemanticTypesetVariant[];
    recommendation: {
        winner: SemanticTypesetVariantId;
        summary: string;
    };
    metrics: {
        sentenceCount: number;
        clauseCount: number;
        averageSentenceSimilarity: number;
    };
};
export type SemanticTypesetOptions = PrepareTypesetOptions & {
    widthPx: number;
};
export declare function collectSemanticTypesetTexts(options: SemanticTypesetOptions): string[];
export declare function analyzeSemanticTypesetParagraph(options: SemanticTypesetOptions): SemanticTypesetReport;
export declare function analyzeSemanticTypesetParagraphWithEmbeddings(options: SemanticTypesetOptions, embeddingsByText: Map<string, number[]>, model: FutureEmbeddingModel, warnings?: string[]): SemanticTypesetReport;
