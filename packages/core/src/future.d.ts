import type { AuditReport } from './audit.ts';
export declare const FUTURE_EMBEDDING_MODELS: readonly ["@cf/baai/bge-small-en-v1.5", "@cf/google/embeddinggemma-300m"];
export type FutureEmbeddingModel = (typeof FUTURE_EMBEDDING_MODELS)[number] | 'heuristic-hash';
export type FutureTopologyMode = 'heuristic' | 'ml' | 'auto';
export type FutureTopologyItem = {
    id: string;
    role: string;
    label: string;
    text: string;
    href?: string;
    locked?: boolean;
};
export type FutureTopologyCluster = {
    id: number;
    label: string;
    itemIds: string[];
    cohesion: number;
    averageQueryScore: number;
};
export type FutureSlotPlan = {
    slot: string;
    itemIds: string[];
    rationale: string;
};
export type FutureTopologyNode = FutureTopologyItem & {
    index: number;
    clusterId: number;
    x: number;
    y: number;
    centrality: number;
    queryScore: number;
    bridgeScore: number;
    anchorScore: number;
    slot: string;
    affinities: number[];
};
export type FutureTopologyReport = {
    mode: 'heuristic' | 'ml';
    model: FutureEmbeddingModel;
    query: string;
    dimensions: number;
    items: FutureTopologyNode[];
    matrix: number[][];
    clusters: FutureTopologyCluster[];
    recommendation: {
        anchorId: string;
        bridgeId: string;
        readingOrder: string[];
        slotPlan: FutureSlotPlan[];
        notes: string[];
    };
    metrics: {
        clusterSeparation: number;
        adjacencyConfidence: number;
        centralitySpread: number;
        queryAlignment: number;
    };
    evaluation: {
        verdict: 'promising' | 'exploratory' | 'weak';
        summary: string;
        reasons: string[];
        shouldDriveLayout: boolean;
    };
    warnings: string[];
};
export declare function composeFutureTopologyText(item: FutureTopologyItem): string;
export declare function createHeuristicEmbedding(text: string, dimensions?: number): number[];
export declare function createHeuristicEmbeddings(texts: string[]): number[][];
export declare function cosineSimilarity(left: number[], right: number[]): number;
export declare function buildSimilarityMatrix(vectors: number[][]): number[][];
export declare function analyzeEmbeddingTopology(options: {
    items: FutureTopologyItem[];
    query: string;
    itemEmbeddings: number[][];
    queryEmbedding: number[];
    model: FutureEmbeddingModel;
    mode: 'heuristic' | 'ml';
    warnings?: string[];
}): FutureTopologyReport;
export declare function analyzeEmbeddingTopologyHeuristic(items: FutureTopologyItem[], query: string): FutureTopologyReport;
export declare function futureSimilarityBand(value: number): 'tight' | 'related' | 'weak';
export type FutureRefinement = {
    kind: 'demote';
    itemId: string;
    fromRole: string;
    toRole: string;
} | {
    kind: 'promote';
    itemId: string;
    fromRole: string;
    toRole: string;
} | {
    kind: 'merge-hint';
    itemIds: string[];
    reason: string;
};
export type FutureDiagnosis = {
    stable: boolean;
    notes: string[];
    refinements: FutureRefinement[];
};
export declare function generateLayoutCss(report: FutureTopologyReport): string;
export declare function diagnoseFutureTopology(report: FutureTopologyReport, auditReport?: AuditReport): FutureDiagnosis;
export declare function refineFutureItems(items: FutureTopologyItem[], refinements: FutureRefinement[]): FutureTopologyItem[];
