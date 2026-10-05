import { describe, expect, it } from 'vitest';
import { flowPreparedLinesByWidth } from './linebreak.ts';
import { layoutPreparedNextLine, prepareTypesetParagraph, typesetParagraph } from './typeset.ts';

const recovery = 'Flow recovers all words.';

describe('discretionary hyphen reconstruction', () => {
  it.each(['normal', 'pre-wrap'] as const)('preserves a complete word on one line in %s mode', (whiteSpace) => {
    const options = { text: recovery, fontSize: 12, lineHeight: 1.5, language: 'en', whiteSpace, engine: 'advanced' as const };
    const result = typesetParagraph({ ...options, widthPx: 280, hyphenate: true });
    const unhyphenated = typesetParagraph({ ...options, widthPx: 280, hyphenate: false });
    expect(result.lines.map((line) => line.text)).toEqual([recovery]);
    expect(result.lines[0].width).toBe(unhyphenated.lines[0].width);
    expect(result.lines[0].paintWidth).toBe(unhyphenated.lines[0].paintWidth);
    expect(result.usedHyphenation).toBe(false);
  });

  it('preserves the exact recovery text through prepared lead/body flow', () => {
    const prepared = prepareTypesetParagraph({ text: recovery, fontSize: 12, lineHeight: 1.5, language: 'en', hyphenate: true, whiteSpace: 'pre-wrap', engine: 'advanced' });
    expect(layoutPreparedNextLine(prepared, { chunkIndex: 0, segmentIndex: 0 }, 160)?.text).toBe(recovery);
    const flow = flowPreparedLinesByWidth(prepared, [{ label: 'lead', widthPx: 160, maxLines: 2 }, { label: 'body', widthPx: 220 }]);
    expect(flow.lines.map((line) => line.text)).toEqual([recovery]);
    expect(flow.usedAllText).toBe(true);
  });

  it('adds and measures a discretionary hyphen only when the word actually crosses lines', () => {
    const options = { text: 'recovers', fontSize: 12, language: 'en', hyphenate: true, whiteSpace: 'pre-wrap' as const };
    const result = typesetParagraph({ ...options, widthPx: 33 });
    expect(result.lines.map((line) => line.text)).toEqual(['reco-', 'vers']);
    expect(result.lines[0].width).toBeCloseTo((4 * 0.56 + 0.36) * 12, 2);
    expect(result.usedHyphenation).toBe(true);
    const prepared = prepareTypesetParagraph(options);
    const flow = flowPreparedLinesByWidth(prepared, [{ widthPx: 33, maxLines: 1 }, { widthPx: 220 }]);
    expect(flow.lines.map((line) => line.text)).toEqual(['reco-', 'vers']);
    expect(flow.usedAllText).toBe(true);
  });

  it('keeps authored hyphens and whitespace without claiming discretionary hyphenation', () => {
    const text = '  recovers\twith real-hyphens -  ';
    const result = typesetParagraph({ text, widthPx: 400, fontSize: 12, language: 'en', hyphenate: true, whiteSpace: 'pre-wrap' });
    expect(result.lines.map((line) => line.text)).toEqual([text]);
    expect(result.usedHyphenation).toBe(false);
  });
});
