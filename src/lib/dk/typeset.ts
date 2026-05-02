import { clamp01, round, type EngineMode, type WhiteSpaceMode } from './types.ts';

const TAB_SIZE = 8;
const ENGLISH_VOWEL_PATTERN = /[aeiouy]/i;

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

type TypesetChunkResult = {
  lines: TypesetLine[];
  badness: number;
};

function glyphFactor(char: string): number {
  if (char === ' ') {
    return 0.32;
  }
  if (/[A-Z0-9]/.test(char)) {
    return 0.68;
  }
  if (/[mwMW@#%&]/.test(char)) {
    return 0.9;
  }
  if (/[iltI1]/.test(char)) {
    return 0.34;
  }
  if (/[-–—]/.test(char)) {
    return 0.36;
  }
  if (/[.,;:'"`]/.test(char)) {
    return 0.24;
  }
  if ((char.codePointAt(0) ?? 0) > 0xff) {
    return 0.96;
  }
  return 0.56;
}

function measure(text: string, fontSize: number, opticalSizing: boolean): number {
  const optical = opticalSizing ? 0.985 : 1;
  const units = Array.from(text).reduce((sum, char) => sum + glyphFactor(char), 0);
  return units * fontSize * optical;
}

function isEnglishVowel(char: string): boolean {
  return ENGLISH_VOWEL_PATTERN.test(char);
}

function findEnglishHyphenPoint(word: string): number | null {
  const lower = word.toLowerCase();
  const candidates: number[] = [];

  for (let index = 3; index <= word.length - 3; index += 1) {
    const previous = lower[index - 1] ?? '';
    const current = lower[index] ?? '';
    const beforePrevious = lower[index - 2] ?? '';

    if (isEnglishVowel(previous) && !isEnglishVowel(current)) {
      candidates.push(index);
      continue;
    }

    if (!isEnglishVowel(previous) && isEnglishVowel(current) && !isEnglishVowel(beforePrevious)) {
      candidates.push(index);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const target = word.length * 0.52;
  return candidates.reduce((best, candidate) =>
    Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best
  );
}

function hyphenateWord(word: string, language: string): string[] {
  if (!language.startsWith('en') || !/^[A-Za-z]+$/.test(word)) {
    return [word];
  }

  const firstBreak = findEnglishHyphenPoint(word);
  if (firstBreak === null) {
    return [word];
  }

  const pieces = [word.slice(0, firstBreak), word.slice(firstBreak)];
  if (word.length < 15) {
    return pieces;
  }

  const secondBreak = findEnglishHyphenPoint(pieces[1]);
  if (secondBreak === null) {
    return pieces;
  }

  return [pieces[0], pieces[1].slice(0, secondBreak), pieces[1].slice(secondBreak)];
}

function normalizePreparationOptions(options: PrepareTypesetOptions): PreparedTypesetParagraph {
  return {
    engine: options.engine ?? 'advanced',
    whiteSpace: options.whiteSpace ?? 'normal',
    text: options.text,
    fontSize: options.fontSize,
    lineHeight: options.lineHeight ?? 1.5,
    language: options.language ?? 'en',
    hyphenate: options.hyphenate ?? false,
    opticalSizing: options.opticalSizing ?? false,
    chunks: [],
    segmentCount: 0,
    chunkCount: 0
  };
}

function pushWordSegments(
  segments: PreparedTypesetSegment[],
  word: string,
  prepared: PreparedTypesetParagraph
): void {
  const pieces = prepared.hyphenate && word.length >= 8 ? hyphenateWord(word, prepared.language) : [word];

  for (let index = 0; index < pieces.length; index += 1) {
    const isLastPiece = index === pieces.length - 1;
    const text = isLastPiece ? pieces[index] : `${pieces[index]}-`;
    segments.push({
      text,
      width: measure(text, prepared.fontSize, prepared.opticalSizing),
      canHang: false
    });
  }
}

function buildNormalSegments(text: string, prepared: PreparedTypesetParagraph): PreparedTypesetSegment[] {
  const segments: PreparedTypesetSegment[] = [];
  for (const word of text.trim().split(/\s+/)) {
    if (!word) {
      continue;
    }
    pushWordSegments(segments, word, prepared);
    segments.push({
      text: ' ',
      width: measure(' ', prepared.fontSize, prepared.opticalSizing),
      canHang: true
    });
  }

  while (segments.at(-1)?.canHang) {
    segments.pop();
  }

  return segments;
}

function buildPreWrapSegments(text: string, prepared: PreparedTypesetParagraph): PreparedTypesetSegment[] {
  const segments: PreparedTypesetSegment[] = [];
  let word = '';
  const spaceWidth = measure(' ', prepared.fontSize, prepared.opticalSizing);

  const flushWord = (): void => {
    if (!word) {
      return;
    }
    pushWordSegments(segments, word, prepared);
    word = '';
  };

  for (const char of Array.from(text)) {
    if (char === ' ') {
      flushWord();
      segments.push({
        text: char,
        width: spaceWidth,
        canHang: true
      });
      continue;
    }

    if (char === '\t') {
      flushWord();
      segments.push({
        text: char,
        width: spaceWidth * TAB_SIZE,
        canHang: true
      });
      continue;
    }

    word += char;
  }

  flushWord();
  return segments;
}

function lineText(
  segments: PreparedTypesetSegment[],
  start: number,
  end: number,
  whiteSpace: WhiteSpaceMode
): string {
  const text = segments
    .slice(start, end)
    .map((segment) => segment.text)
    .join('');
  return whiteSpace === 'pre-wrap' ? text : text.trim();
}

function lineWidths(
  segments: PreparedTypesetSegment[],
  start: number,
  end: number,
  whiteSpace: WhiteSpaceMode
): { fitWidth: number; paintWidth: number } {
  const slice = segments.slice(start, end);
  const paintWidth = slice.reduce((sum, segment) => sum + segment.width, 0);
  let fitEnd = slice.length;

  if (whiteSpace === 'pre-wrap') {
    while (fitEnd > 0 && slice[fitEnd - 1]?.canHang) {
      fitEnd -= 1;
    }
  }

  return {
    fitWidth: slice.slice(0, fitEnd).reduce((sum, segment) => sum + segment.width, 0),
    paintWidth
  };
}

function createLine(
  text: string,
  fitWidth: number,
  paintWidth: number,
  measureWidth: number
): TypesetLine {
  const width = round(fitWidth);
  return {
    text,
    width,
    paintWidth: round(paintWidth),
    ratio: round(clamp01(width / Math.max(measureWidth, 1)), 3)
  };
}

function typesetPreparedChunk(
  prepared: PreparedTypesetParagraph,
  chunkIndex: number,
  segments: PreparedTypesetSegment[],
  whiteSpace: WhiteSpaceMode,
  widthPx: number,
  targetLastChunk: boolean,
  linePenalty?: TypesetLinePenaltyFn
): TypesetChunkResult {
  if (segments.length === 0) {
    return {
      lines: [createLine('', 0, 0, widthPx)],
      badness: 0
    };
  }

  const limit = widthPx * 1.08;
  const costs = Array.from({ length: segments.length + 1 }, () => Number.POSITIVE_INFINITY);
  const breaks = Array<number>(segments.length + 1).fill(-1);
  costs[0] = 0;

  for (let start = 0; start < segments.length; start += 1) {
    if (!Number.isFinite(costs[start])) {
      continue;
    }

    for (let end = start + 1; end <= segments.length; end += 1) {
      const text = lineText(segments, start, end, whiteSpace);
      const { fitWidth, paintWidth } = lineWidths(segments, start, end, whiteSpace);
      if (!text && fitWidth === 0) {
        continue;
      }
      if (fitWidth > limit) {
        break;
      }

      const leftover = Math.max(0, widthPx - fitWidth);
      const isLastLine = end === segments.length;
      const ragPenalty = isLastLine && targetLastChunk ? leftover * leftover * 0.16 : leftover * leftover;
      const visibleText = whiteSpace === 'pre-wrap' ? text.replace(/[ \t]+$/g, '').trim() : text;
      const lengthPenalty = visibleText.length > 0 && visibleText.length <= 2 ? 1200 : 0;
      const hyphenPenalty = visibleText.endsWith('-') ? 120 : 0;
      const customPenalty = linePenalty?.({
        prepared,
        chunkIndex,
        start,
        end,
        text,
        visibleText,
        fitWidth,
        paintWidth,
        widthPx,
        isLastLine,
        targetLastChunk
      }) ?? 0;
      const nextCost = costs[start] + ragPenalty + lengthPenalty + hyphenPenalty + customPenalty;

      if (nextCost < costs[end]) {
        costs[end] = nextCost;
        breaks[end] = start;
      }
    }
  }

  const lines: TypesetLine[] = [];
  let cursor = segments.length;
  while (cursor > 0 && breaks[cursor] >= 0) {
    const start = breaks[cursor];
    const text = lineText(segments, start, cursor, whiteSpace);
    const { fitWidth, paintWidth } = lineWidths(segments, start, cursor, whiteSpace);
    lines.unshift(createLine(text, fitWidth, paintWidth, widthPx));
    cursor = start;
  }

  if (cursor > 0) {
    const text = lineText(segments, 0, cursor, whiteSpace);
    const { fitWidth, paintWidth } = lineWidths(segments, 0, cursor, whiteSpace);
    lines.unshift(createLine(text, fitWidth, paintWidth, widthPx));
  }

  return {
    lines,
    badness: Number.isFinite(costs[segments.length]) ? costs[segments.length] : 0
  };
}

export function collectPreparedLineCandidates(
  prepared: PreparedTypesetParagraph,
  widthPx: number
): PreparedLineCandidate[] {
  const candidates: PreparedLineCandidate[] = [];
  const limit = widthPx * 1.08;

  for (const [chunkIndex, chunk] of prepared.chunks.entries()) {
    if (chunk.segments.length === 0) {
      continue;
    }

    for (let start = 0; start < chunk.segments.length; start += 1) {
      for (let end = start + 1; end <= chunk.segments.length; end += 1) {
        const text = lineText(chunk.segments, start, end, prepared.whiteSpace);
        const { fitWidth, paintWidth } = lineWidths(chunk.segments, start, end, prepared.whiteSpace);
        if (!text && fitWidth === 0) {
          continue;
        }
        if (fitWidth > limit) {
          break;
        }

        candidates.push({
          prepared,
          chunkIndex,
          start,
          end,
          text,
          visibleText:
            prepared.whiteSpace === 'pre-wrap' ? text.replace(/[ \t]+$/g, '').trim() : text,
          fitWidth,
          paintWidth,
          widthPx,
          isLastLine: end === chunk.segments.length,
          targetLastChunk: chunkIndex === prepared.chunks.length - 1
        });
      }
    }
  }

  return candidates;
}

function lineEndCursor(prepared: PreparedTypesetParagraph, chunkIndex: number, segmentIndex: number): TypesetCursor {
  const chunk = prepared.chunks.at(chunkIndex);
  if (chunk === undefined || segmentIndex >= chunk.segments.length) {
    return {
      chunkIndex: chunkIndex + 1,
      segmentIndex: 0
    };
  }

  return {
    chunkIndex,
    segmentIndex
  };
}

export function prepareTypesetParagraph(options: PrepareTypesetOptions): PreparedTypesetParagraph {
  const prepared = normalizePreparationOptions(options);

  if (prepared.whiteSpace === 'normal') {
    const segments = buildNormalSegments(prepared.text, prepared);
    prepared.chunks = segments.length > 0 ? [{ text: prepared.text.trim(), segments }] : [];
  } else {
    const normalized = prepared.text.replace(/\r\n?/g, '\n');
    if (normalized.length > 0) {
      const rawChunks = normalized.endsWith('\n') ? normalized.slice(0, -1).split('\n') : normalized.split('\n');
      prepared.chunks = rawChunks.map((chunkText) => ({
        text: chunkText,
        segments: buildPreWrapSegments(chunkText, prepared)
      }));
    }
  }

  prepared.chunkCount = prepared.chunks.length;
  prepared.segmentCount = prepared.chunks.reduce((sum, chunk) => sum + chunk.segments.length, 0);
  return prepared;
}

export function layoutPreparedParagraph(
  prepared: PreparedTypesetParagraph,
  widthPx: number,
  targetLines?: number
): TypesetResult {
  return layoutPreparedParagraphWithPenalty(prepared, widthPx, { targetLines });
}

export function layoutPreparedParagraphWithPenalty(
  prepared: PreparedTypesetParagraph,
  widthPx: number,
  options: {
    targetLines?: number;
    linePenalty?: TypesetLinePenaltyFn;
  } = {}
): TypesetResult {
  if (prepared.chunks.length === 0) {
    return {
      engine: prepared.engine,
      whiteSpace: prepared.whiteSpace,
      lines: [],
      badness: 0,
      averageWidth: 0,
      variance: 0,
      usedHyphenation: false,
      lineCount: 0,
      maxLineWidth: 0,
      heightPx: 0,
      segmentCount: prepared.segmentCount,
      chunkCount: prepared.chunkCount
    };
  }

  const lines: TypesetLine[] = [];
  let chunkBadness = 0;

  for (const [index, chunk] of prepared.chunks.entries()) {
    const result = typesetPreparedChunk(
      prepared,
      index,
      chunk.segments,
      prepared.whiteSpace,
      widthPx,
      index === prepared.chunks.length - 1,
      options.linePenalty
    );
    lines.push(...result.lines);
    chunkBadness += result.badness;
  }

  const widths = lines.map((line) => line.width);
  const averageWidth = widths.reduce((sum, value) => sum + value, 0) / Math.max(widths.length, 1);
  const variance =
    widths.reduce((sum, value) => sum + (value - averageWidth) ** 2, 0) / Math.max(widths.length, 1);
  const targetPenalty = options.targetLines ? Math.abs(lines.length - options.targetLines) * widthPx * 2.2 : 0;
  const maxLineWidth = round(Math.max(0, ...widths));

  return {
    engine: prepared.engine,
    whiteSpace: prepared.whiteSpace,
    lines,
    badness: Math.round(chunkBadness + targetPenalty + variance * 0.08),
    averageWidth: round(averageWidth),
    variance: round(variance),
    usedHyphenation: lines.some((line) => line.text.replace(/[ \t]+$/g, '').endsWith('-')),
    lineCount: lines.length,
    maxLineWidth,
    heightPx: round(lines.length * prepared.fontSize * prepared.lineHeight),
    segmentCount: prepared.segmentCount,
    chunkCount: prepared.chunkCount
  };
}

export function layoutPreparedNextLine(
  prepared: PreparedTypesetParagraph,
  start: TypesetCursor,
  widthPx: number
): PreparedTypesetLine | null {
  let chunkIndex = start.chunkIndex;
  let segmentIndex = start.segmentIndex;
  const limit = widthPx * 1.08;

  while (chunkIndex < prepared.chunks.length) {
    const chunk = prepared.chunks.at(chunkIndex);
    if (chunk === undefined) {
      return null;
    }

    if (chunk.segments.length === 0 && segmentIndex === 0) {
      return {
        ...createLine('', 0, 0, widthPx),
        chunkIndex,
        start: { chunkIndex, segmentIndex: 0 },
        end: { chunkIndex: chunkIndex + 1, segmentIndex: 0 }
      };
    }

    if (segmentIndex >= chunk.segments.length) {
      chunkIndex += 1;
      segmentIndex = 0;
      continue;
    }

    let bestEnd = -1;
    let bestFitWidth = 0;
    let bestPaintWidth = 0;

    for (let end = segmentIndex + 1; end <= chunk.segments.length; end += 1) {
      const { fitWidth, paintWidth } = lineWidths(chunk.segments, segmentIndex, end, prepared.whiteSpace);
      if (fitWidth > limit && bestEnd !== -1) {
        break;
      }
      if (fitWidth <= limit || bestEnd === -1) {
        bestEnd = end;
        bestFitWidth = fitWidth;
        bestPaintWidth = paintWidth;
      }
    }

    if (bestEnd === -1) {
      return null;
    }

    const text = lineText(chunk.segments, segmentIndex, bestEnd, prepared.whiteSpace);
    return {
      ...createLine(text, bestFitWidth, bestPaintWidth, widthPx),
      chunkIndex,
      start: { chunkIndex, segmentIndex },
      end: lineEndCursor(prepared, chunkIndex, bestEnd)
    };
  }

  return null;
}

export function walkPreparedLineRanges(
  prepared: PreparedTypesetParagraph,
  widthPx: number,
  onLine: (line: TypesetLineRange) => void
): number {
  let count = 0;
  let cursor: TypesetCursor = { chunkIndex: 0, segmentIndex: 0 };

  for (;;) {
    const line = layoutPreparedNextLine(prepared, cursor, widthPx);
    if (line === null) {
      break;
    }

    onLine({
      chunkIndex: line.chunkIndex,
      width: line.width,
      paintWidth: line.paintWidth,
      start: line.start,
      end: line.end
    });
    cursor = line.end;
    count += 1;
  }

  return count;
}

export function findPreparedTightWidth(
  prepared: PreparedTypesetParagraph,
  widthPx: number
): { width: number; lineCount: number } {
  let tightWidth = 0;
  const lineCount = walkPreparedLineRanges(prepared, widthPx, (line) => {
    tightWidth = Math.max(tightWidth, line.width);
  });

  return {
    width: round(tightWidth),
    lineCount
  };
}

export function typesetParagraph(options: TypesetOptions): TypesetResult {
  const prepared = prepareTypesetParagraph(options);
  return layoutPreparedParagraph(prepared, options.widthPx, options.targetLines);
}
