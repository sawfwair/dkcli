// Linebreak — Dynamic-programming line breaking for balanced headlines and labels.

import {
  layoutPreparedNextLine,
  prepareTypesetParagraph,
  typesetParagraph,
  type PrepareTypesetOptions,
  type PreparedTypesetLine,
  type PreparedTypesetParagraph,
  type TypesetOptions,
  type TypesetResult
} from './typeset.ts';
import { round } from './types.ts';

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

function lineLength(words: string[], start: number, end: number): number {
  return words.slice(start, end).join(' ').length;
}

export function greedyBreak(text: string, maxChars: number): LineBreakResult {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    const nextLine = [...current, word].join(' ');
    if (current.length > 0 && nextLine.length > maxChars) {
      lines.push(current.join(' '));
      current = [word];
    } else {
      current.push(word);
    }
  }
  if (current.length > 0) {
    lines.push(current.join(' '));
  }

  const badness = lines.reduce((sum, line) => sum + (maxChars - line.length) ** 2, 0);
  return { lines, badness };
}

export function balanceLines(text: string, maxChars: number, targetLines?: number): LineBreakResult {
  const words = text.trim().split(/\s+/);
  const count = words.length;
  const costs = Array.from({ length: count + 1 }, () => Number.POSITIVE_INFINITY);
  const breaks = Array<number>(count + 1).fill(-1);
  costs[0] = 0;

  for (let start = 0; start < count; start += 1) {
    if (!Number.isFinite(costs[start])) {
      continue;
    }
    for (let end = start + 1; end <= count; end += 1) {
      const length = lineLength(words, start, end);
      if (length > maxChars) {
        break;
      }
      const remainder = maxChars - length;
      const isLastLine = end === count;
      const linePenalty = isLastLine ? remainder ** 2 * 0.35 : remainder ** 2;
      const nextCost = costs[start] + linePenalty;
      if (nextCost < costs[end]) {
        costs[end] = nextCost;
        breaks[end] = start;
      }
    }
  }

  const lines: string[] = [];
  let cursor = count;
  while (cursor > 0 && breaks[cursor] >= 0) {
    const start = breaks[cursor];
    lines.unshift(words.slice(start, cursor).join(' '));
    cursor = start;
  }
  if (cursor > 0) {
    lines.unshift(words.slice(0, cursor).join(' '));
  }

  let badness = costs[count];
  if (targetLines !== undefined) {
    badness += Math.abs(lines.length - targetLines) * maxChars * 2;
  }

  return {
    lines,
    badness: Math.round(badness)
  };
}

export function balanceLinesByWidth(options: TypesetOptions): AdvancedLineBreakResult {
  return typesetParagraph(options);
}

function normalizeFlowSlots(slots: LineFlowSlot[]): LineFlowSlotResult[] {
  return slots.map((slot, index) => ({
    widthPx: slot.widthPx,
    maxLines: slot.maxLines,
    label: slot.label ?? `slot ${index + 1}`,
    lines: []
  }));
}

export function flowPreparedLinesByWidth(
  prepared: PreparedTypesetParagraph,
  slots: LineFlowSlot[]
): LineFlowResult {
  const normalizedSlots = normalizeFlowSlots(slots);
  if (normalizedSlots.length === 0) {
    return {
      slots: [],
      lines: [],
      lineCount: 0,
      tightWidth: 0,
      usedAllText: prepared.chunkCount === 0,
      segmentCount: prepared.segmentCount,
      chunkCount: prepared.chunkCount
    };
  }

  const lines: LineFlowLine[] = [];
  let cursor = { chunkIndex: 0, segmentIndex: 0 };
  let slotPointer = 0;
  let slotLineCount = 0;

  for (;;) {
    const slotIndex = Math.min(slotPointer, normalizedSlots.length - 1);
    const slot = normalizedSlots[slotIndex];

    const line = layoutPreparedNextLine(prepared, cursor, slot.widthPx);
    if (line === null) {
      break;
    }

    const flowLine: LineFlowLine = {
      ...line,
      slotIndex,
      slotLabel: slot.label,
      limit: slot.widthPx,
      ordinal: lines.length + 1
    };

    slot.lines.push(flowLine);
    lines.push(flowLine);
    cursor = line.end;
    slotLineCount += 1;

    if (slotPointer < normalizedSlots.length - 1 && slot.maxLines !== undefined && slotLineCount >= slot.maxLines) {
      slotPointer += 1;
      slotLineCount = 0;
    }
  }

  return {
    slots: normalizedSlots,
    lines,
    lineCount: lines.length,
    tightWidth: round(Math.max(...lines.map((line) => line.width), 0)),
    usedAllText: cursor.chunkIndex >= prepared.chunkCount,
    segmentCount: prepared.segmentCount,
    chunkCount: prepared.chunkCount
  };
}

export function flowLinesByWidth(options: PrepareTypesetOptions, slots: LineFlowSlot[]): LineFlowResult {
  const prepared = prepareTypesetParagraph(options);
  return flowPreparedLinesByWidth(prepared, slots);
}
