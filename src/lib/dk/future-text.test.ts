import { describe, expect, it } from 'vitest';

import { analyzeSemanticTypesetParagraph, collectSemanticTypesetTexts } from './future-text';

describe('future semantic typeset', () => {
  it('compares advanced, syntax-aware, and semantic paragraph setting', () => {
    const report = analyzeSemanticTypesetParagraph({
      text: 'Meaning should guide the break when one sentence finishes and another pivots. Supporting clauses can stay together, but topic shifts deserve air.',
      widthPx: 320,
      fontSize: 18,
      lineHeight: 1.55,
      language: 'en',
      hyphenate: false,
      opticalSizing: true,
      whiteSpace: 'normal',
      engine: 'advanced'
    });

    expect(report.variants).toHaveLength(3);
    expect(report.mode).toBe('heuristic');
    expect(report.model).toBe('heuristic-hash');
    expect(report.units.sentences.length).toBeGreaterThanOrEqual(2);
    expect(report.metrics.clauseCount).toBeGreaterThanOrEqual(report.metrics.sentenceCount);
    expect(report.recommendation.winner).toMatch(/^(advanced|syntax|semantic)$/);
    expect(report.variants.some((variant) => variant.deltaBadness !== 0)).toBe(true);
    expect(report.shifts.every((shift) => shift.similarity <= 1 && shift.similarity >= -1)).toBe(true);
  });

  it('collects the line candidates and semantic subunits needed for runtime embeddings', () => {
    const texts = collectSemanticTypesetTexts({
      text: 'Meaning should guide the break. Topic shifts deserve air.',
      widthPx: 320,
      fontSize: 18,
      lineHeight: 1.55,
      language: 'en',
      hyphenate: false,
      opticalSizing: true,
      whiteSpace: 'normal',
      engine: 'advanced'
    });

    expect(texts.length).toBeGreaterThan(2);
    expect(texts).toContain('Meaning should guide the break.');
    expect(texts).toContain('Topic shifts deserve air.');
  });
});
