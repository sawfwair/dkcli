import { describe, expect, it } from 'vitest';

import { scoreComposition, scoreDesignComposition, type Rect } from './compose.ts';
import type { DesignDocument } from './design.ts';
import { analyzeImportance } from './saliency.ts';

describe('compose', () => {
  it('rewards a balanced composition more than a lopsided one', () => {
    const balanced: Rect[] = [
      { id: 'a', x: 40, y: 40, width: 120, height: 120 },
      { id: 'b', x: 240, y: 40, width: 120, height: 120 },
      { id: 'c', x: 140, y: 200, width: 120, height: 120 }
    ];
    const lopsided: Rect[] = [
      { id: 'a', x: 20, y: 40, width: 200, height: 200 },
      { id: 'b', x: 30, y: 260, width: 140, height: 80 }
    ];

    const balancedScore = scoreComposition(balanced, { width: 400, height: 400 });
    const lopsidedScore = scoreComposition(lopsided, { width: 400, height: 400 });

    expect(balancedScore.metrics.balance).toBeGreaterThan(lopsidedScore.metrics.balance);
    expect(balancedScore.total).toBeGreaterThan(lopsidedScore.total);
  });

  it('falls back to heuristic saliency for advanced composition scoring', () => {
    const document: DesignDocument = {
      frame: { width: 400, height: 400 },
      elements: [
        { id: 'title', kind: 'text', role: 'title', x: 40, y: 40, width: 220, height: 80 },
        { id: 'body', kind: 'text', role: 'body', x: 40, y: 160, width: 220, height: 120 },
        { id: 'cta', kind: 'shape', role: 'cta', x: 40, y: 320, width: 140, height: 44 }
      ]
    };

    const fallback = scoreDesignComposition(document);
    const explicit = scoreDesignComposition(document, analyzeImportance(document, 'heuristic'));

    expect(fallback.total).toBe(explicit.total);
    expect(fallback.metrics.saliencyRespect).toBeCloseTo(explicit.metrics.saliencyRespect, 5);
  });
});
