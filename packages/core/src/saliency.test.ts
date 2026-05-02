import { describe, expect, it } from 'vitest';

import { analyzeImportance } from './saliency.ts';

describe('saliency', () => {
  it('ranks title elements above supporting copy in the heuristic pass', () => {
    const report = analyzeImportance({
      frame: { width: 880, height: 560, padding: 28, gap: 18, columns: 12 },
      elements: [
        { id: 'headline', kind: 'text', role: 'title', x: 68, y: 116, width: 372, height: 128, color: '#111827', importance: 0.98 },
        { id: 'body', kind: 'text', role: 'body', x: 68, y: 272, width: 340, height: 108, color: '#334155', importance: 0.72 },
        { id: 'cta', kind: 'shape', role: 'cta', x: 68, y: 424, width: 182, height: 54, background: '#295dff', color: '#ffffff', importance: 0.86 }
      ]
    });

    expect(report.elements[0]?.id).toBe('headline');
    expect(report.elements[0]?.normalized).toBeGreaterThan(report.elements.at(-1)?.normalized ?? 0);
  });
});
