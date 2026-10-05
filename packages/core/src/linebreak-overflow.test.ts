import { describe, expect, it } from 'vitest';
import { balanceLines, greedyBreak } from './linebreak.ts';
import { typesetParagraph } from './typeset.ts';
import { recommendTypography } from './typography.ts';

describe('line breaking around an unbreakable word', () => {
  it('rejects finite measures and font sizes whose derived estimates overflow', () => {
    expect(() => balanceLines('A paragraph', Number.MAX_VALUE)).toThrow();
    expect(() => typesetParagraph({ text: 'A paragraph', widthPx: 200, fontSize: Number.MAX_VALUE })).toThrow();
  });
  it('isolates an overlong word and continues wrapping all following words with finite badness', () => {
    const result = balanceLines('unbreakablelongword a few words', 8);
    expect(result.lines[0]).toBe('unbreakablelongword');
    expect(result.lines.slice(1).every((line) => line.length <= 8)).toBe(true);
    expect(result.lines.join(' ')).toBe('unbreakablelongword a few words');
    expect(Number.isFinite(result.badness)).toBe(true);
    expect(result.badness).toBeGreaterThan(0);
  });

  it('preserves width overflow evidence without giving the whole paragraph zero badness', () => {
    const result = typesetParagraph({ text: 'unbreakablelongword a few words', widthPx: 60, fontSize: 16 });
    expect(result.lines[0].text).toBe('unbreakablelongword');
    expect(result.lines.slice(1).every((line) => line.width <= 60 * 1.08)).toBe(true);
    expect(result.lines.map((line) => line.text).join(' ')).toBe('unbreakablelongword a few words');
    expect(result.maxLineWidth).toBeGreaterThan(60);
    expect(Number.isFinite(result.badness)).toBe(true);
    expect(result.badness).toBeGreaterThan(0);
  });

  it('represents an empty paragraph without a fabricated blank line or penalty', () => {
    expect(balanceLines('  ', 8)).toEqual({ lines: [], badness: 0 });
    expect(greedyBreak('  ', 8)).toEqual({ lines: [], badness: 0 });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid measures %s', (width) => {
    expect(() => balanceLines('A paragraph', width)).toThrow();
    expect(() => greedyBreak('A paragraph', width)).toThrow();
    expect(() => typesetParagraph({ text: 'A paragraph', widthPx: width, fontSize: 16 })).toThrow();
  });

  it.each([0, -16, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid font sizes %s', (fontSize) => {
    expect(() => typesetParagraph({ text: 'A paragraph', widthPx: 200, fontSize })).toThrow();
    expect(() => recommendTypography({ containerWidth: 200, fontSize })).toThrow();
  });
});
