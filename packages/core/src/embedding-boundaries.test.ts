import { describe, expect, it } from 'vitest';
import { analyzeEmbeddingTopology, buildSimilarityMatrix, cosineSimilarity } from './future.ts';

describe('embedding shape and numeric integrity', () => {
  it.each([1e200, 1e-200])('keeps finite cosine similarity for vectors scaled by %s', (scale) => {
    expect(cosineSimilarity([scale, scale], [scale, scale])).toBe(1);
    expect(cosineSimilarity([scale, 0], [0, scale])).toBe(0);
  });
  it('rejects mismatched dimensions and nonfinite vector coordinates instead of truncating or emitting null', () => {
    expect(() => cosineSimilarity([1, 0], [1])).toThrow();
    expect(() => cosineSimilarity([Number.NaN], [1])).toThrow();
    expect(() => buildSimilarityMatrix([[Number.NaN]])).toThrow();
  });
  it('rejects missing item embeddings rather than returning an empty topology for actual content', () => {
    expect(() => analyzeEmbeddingTopology({ items: [{ id: 'a', role: 'title', label: 'A', text: 'Content' }], itemEmbeddings: [], queryEmbedding: [1], model: 'heuristic-hash', mode: 'heuristic', query: 'Content' })).toThrow();
  });
});
