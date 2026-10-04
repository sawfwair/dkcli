import { type PrepareTypesetOptions, type PreparedTypesetLine, type PreparedTypesetParagraph, type TypesetOptions, type TypesetResult } from './typeset.ts';
export type LineBreakResult = {
    lines: string[];
    badness: number;
};
export type AdvancedLineBreakResult = TypesetResult;
export type LineFlowSlot = {
    widthPx: number;
    maxLines?: number;
    label?: string;
};
export type LineFlowLine = PreparedTypesetLine & {
    slotIndex: number;
    slotLabel: string;
    limit: number;
    ordinal: number;
};
export type LineFlowSlotResult = {
    widthPx: number;
    maxLines?: number;
    label: string;
    lines: LineFlowLine[];
};
export type LineFlowResult = {
    slots: LineFlowSlotResult[];
    lines: LineFlowLine[];
    lineCount: number;
    tightWidth: number;
    usedAllText: boolean;
    segmentCount: number;
    chunkCount: number;
};
export declare function greedyBreak(text: string, maxChars: number): LineBreakResult;
export declare function balanceLines(text: string, maxChars: number, targetLines?: number): LineBreakResult;
export declare function balanceLinesByWidth(options: TypesetOptions): AdvancedLineBreakResult;
export declare function flowPreparedLinesByWidth(prepared: PreparedTypesetParagraph, slots: LineFlowSlot[]): LineFlowResult;
export declare function flowLinesByWidth(options: PrepareTypesetOptions, slots: LineFlowSlot[]): LineFlowResult;
