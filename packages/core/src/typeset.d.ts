import { type EngineMode, type WhiteSpaceMode } from './types.ts';
export type PrepareTypesetOptions = {
    text: string;
    fontSize: number;
    lineHeight?: number;
    language?: string;
    fontFamily?: string;
    fontFile?: string;
    hyphenate?: boolean;
    opticalSizing?: boolean;
    whiteSpace?: WhiteSpaceMode;
    engine?: EngineMode;
};
export type TypesetOptions = PrepareTypesetOptions & {
    widthPx: number;
    targetLines?: number;
};
export type PreparedTypesetSegment = {
    text: string;
    width: number;
    canHang: boolean;
};
export type PreparedTypesetChunk = {
    text: string;
    segments: PreparedTypesetSegment[];
};
export type PreparedTypesetParagraph = {
    engine: EngineMode;
    whiteSpace: WhiteSpaceMode;
    text: string;
    fontSize: number;
    lineHeight: number;
    language: string;
    hyphenate: boolean;
    opticalSizing: boolean;
    chunks: PreparedTypesetChunk[];
    segmentCount: number;
    chunkCount: number;
};
export type TypesetCursor = {
    chunkIndex: number;
    segmentIndex: number;
};
export type TypesetLine = {
    text: string;
    width: number;
    paintWidth: number;
    ratio: number;
};
export type PreparedTypesetLine = TypesetLine & {
    chunkIndex: number;
    start: TypesetCursor;
    end: TypesetCursor;
};
export type TypesetLineRange = {
    chunkIndex: number;
    width: number;
    paintWidth: number;
    start: TypesetCursor;
    end: TypesetCursor;
};
export type TypesetLinePenaltyInput = {
    prepared: PreparedTypesetParagraph;
    chunkIndex: number;
    start: number;
    end: number;
    text: string;
    visibleText: string;
    fitWidth: number;
    paintWidth: number;
    widthPx: number;
    isLastLine: boolean;
    targetLastChunk: boolean;
};
export type TypesetLinePenaltyFn = (input: TypesetLinePenaltyInput) => number;
export type PreparedLineCandidate = TypesetLinePenaltyInput;
export type TypesetResult = {
    engine: EngineMode;
    whiteSpace: WhiteSpaceMode;
    lines: TypesetLine[];
    badness: number;
    averageWidth: number;
    variance: number;
    usedHyphenation: boolean;
    lineCount: number;
    maxLineWidth: number;
    heightPx: number;
    segmentCount: number;
    chunkCount: number;
};
export declare function collectPreparedLineCandidates(prepared: PreparedTypesetParagraph, widthPx: number): PreparedLineCandidate[];
export declare function prepareTypesetParagraph(options: PrepareTypesetOptions): PreparedTypesetParagraph;
export declare function layoutPreparedParagraph(prepared: PreparedTypesetParagraph, widthPx: number, targetLines?: number): TypesetResult;
export declare function layoutPreparedParagraphWithPenalty(prepared: PreparedTypesetParagraph, widthPx: number, options?: {
    targetLines?: number;
    linePenalty?: TypesetLinePenaltyFn;
}): TypesetResult;
export declare function layoutPreparedNextLine(prepared: PreparedTypesetParagraph, start: TypesetCursor, widthPx: number): PreparedTypesetLine | null;
export declare function walkPreparedLineRanges(prepared: PreparedTypesetParagraph, widthPx: number, onLine: (line: TypesetLineRange) => void): number;
export declare function findPreparedTightWidth(prepared: PreparedTypesetParagraph, widthPx: number): {
    width: number;
    lineCount: number;
};
export declare function typesetParagraph(options: TypesetOptions): TypesetResult;
