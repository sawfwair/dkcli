import { describe, expect, it } from 'vitest';

import {
  findPreparedTightWidth,
  layoutPreparedNextLine,
  layoutPreparedParagraph,
  layoutPreparedParagraphWithPenalty,
  prepareTypesetParagraph,
  typesetParagraph,
  walkPreparedLineRanges
} from './typeset';

describe('typeset', () => {
  it('returns width-aware lines and tracks hyphenation usage', () => {
    const result = typesetParagraph({
      text: 'Mathematical typography is not sterile. It is the disciplined shaping of measure and rhythm.',
      widthPx: 360,
      fontSize: 18,
      lineHeight: 1.5,
      language: 'en',
      hyphenate: true,
      opticalSizing: true,
      targetLines: 3,
      engine: 'advanced'
    });

    expect(result.lines.length).toBeGreaterThanOrEqual(2);
    expect(result.averageWidth).toBeGreaterThan(0);
    expect(result.badness).toBeGreaterThan(0);
    expect(result.lineCount).toBe(result.lines.length);
    expect(result.heightPx).toBeGreaterThan(0);
    expect(result.maxLineWidth).toBeGreaterThan(0);
  });

  it('preserves explicit breaks and hanging whitespace in pre-wrap mode', () => {
    const result = typesetParagraph({
      text: 'foo  \n\tbar',
      widthPx: 140,
      fontSize: 16,
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
      engine: 'advanced'
    });

    expect(result.lineCount).toBe(2);
    expect(result.lines[0]?.text).toBe('foo  ');
    expect(result.lines[1]?.text).toBe('\tbar');
    expect(result.lines[0]?.paintWidth).toBeGreaterThan(result.lines[0]?.width ?? 0);
  });

  it('reuses prepared paragraphs for fixed-width layout', () => {
    const prepared = prepareTypesetParagraph({
      text: 'Prepared layout should match the one-shot solver exactly.',
      fontSize: 18,
      lineHeight: 1.48,
      language: 'en',
      hyphenate: true,
      opticalSizing: true,
      engine: 'advanced'
    });

    const direct = typesetParagraph({
      text: 'Prepared layout should match the one-shot solver exactly.',
      widthPx: 320,
      fontSize: 18,
      lineHeight: 1.48,
      language: 'en',
      hyphenate: true,
      opticalSizing: true,
      engine: 'advanced'
    });
    const reused = layoutPreparedParagraph(prepared, 320);

    expect(reused.lines).toEqual(direct.lines);
    expect(reused.badness).toBe(direct.badness);
    expect(reused.segmentCount).toBe(prepared.segmentCount);
    expect(reused.chunkCount).toBe(prepared.chunkCount);
  });

  it('streams variable-width lines from a cursor', () => {
    const prepared = prepareTypesetParagraph({
      text: 'Flow the paragraph through a narrow lead and then a wider body.',
      fontSize: 18,
      lineHeight: 1.5,
      language: 'en',
      hyphenate: true,
      opticalSizing: true,
      engine: 'advanced'
    });

    const first = layoutPreparedNextLine(prepared, { chunkIndex: 0, segmentIndex: 0 }, 180);
    expect(first?.text.length).toBeGreaterThan(0);
    expect(first?.end).not.toEqual({ chunkIndex: 0, segmentIndex: 0 });

    const second = layoutPreparedNextLine(prepared, first?.end ?? { chunkIndex: 0, segmentIndex: 0 }, 320);
    expect(second?.text.length).toBeGreaterThan(0);
  });

  it('walks streamed line ranges and reports the tight width', () => {
    const prepared = prepareTypesetParagraph({
      text: 'Measure once, relayout often, and keep the width honest.',
      fontSize: 17,
      lineHeight: 1.5,
      language: 'en',
      opticalSizing: true,
      engine: 'advanced'
    });

    const widths: number[] = [];
    const lineCount = walkPreparedLineRanges(prepared, 260, (line) => {
      widths.push(line.width);
    });
    const tight = findPreparedTightWidth(prepared, 260);

    expect(lineCount).toBeGreaterThan(0);
    expect(tight.lineCount).toBe(lineCount);
    expect(tight.width).toBe(Math.max(...widths));
  });

  it('accepts a custom line-penalty hook for experimental scoring', () => {
    const prepared = prepareTypesetParagraph({
      text: 'Break after the sentence. Keep the bridge word off the next line.',
      fontSize: 18,
      lineHeight: 1.5,
      language: 'en',
      opticalSizing: true,
      engine: 'advanced'
    });

    const baseline = layoutPreparedParagraph(prepared, 240);
    const custom = layoutPreparedParagraphWithPenalty(prepared, 240, {
      linePenalty: ({ visibleText, isLastLine }) => {
        if (!isLastLine && visibleText.endsWith('.')) {
          return -180;
        }
        if (/^(and|but|or)\b/i.test(visibleText)) {
          return 220;
        }
        return 0;
      }
    });

    expect(custom.lines.length).toBeGreaterThan(0);
    expect(custom.badness).not.toBe(baseline.badness);
  });
});
