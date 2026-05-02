import { describe, expect, it } from 'vitest';

import type { DesignDocument } from './design.ts';
import { solveDesignLayout, solveStackLayout } from './layout.ts';
import { analyzeImportance } from './saliency.ts';

describe('layout', () => {
  it('distributes extra space across grow weights', () => {
    const result = solveStackLayout(
      [
        { id: 'a', min: 80, preferred: 100, grow: 2 },
        { id: 'b', min: 80, preferred: 100, grow: 1 }
      ],
      { container: 360, gap: 20, padding: 20 }
    );

    expect(result.items[0].size).toBeGreaterThan(result.items[1].size);
    expect(result.metrics.free).toBe(0);
    expect(result.metrics.overflow).toBe(0);
  });

  it('shrinks items toward minima under compression', () => {
    const result = solveStackLayout(
      [
        { id: 'a', min: 60, preferred: 120, shrink: 1 },
        { id: 'b', min: 80, preferred: 140, shrink: 2 }
      ],
      { container: 220, gap: 10 }
    );

    expect(result.items[1].size).toBeLessThan(140);
    expect(result.items[1].size).toBeLessThan(result.items[0].size + 40);
    expect(result.metrics.overflow).toBe(0);
  });

  it('places advanced document elements away from avoided regions', () => {
    const result = solveDesignLayout({
      frame: { width: 960, height: 620, padding: 32, gap: 20, columns: 12 },
      background: {
        subjectRegion: { x: 560, y: 40, width: 220, height: 260 }
      },
      elements: [
        { id: 'hero', kind: 'text', role: 'title', x: 72, y: 118, width: 404, height: 138, color: '#151321', importance: 0.96 },
        { id: 'body', kind: 'text', role: 'body', x: 72, y: 292, width: 344, height: 116, color: '#34314a', importance: 0.72 },
        { id: 'cta', kind: 'shape', role: 'cta', x: 72, y: 440, width: 182, height: 54, background: '#295dff', color: '#fff', importance: 0.86 }
      ]
    });

    expect(result.metrics.safeRegionPenalty).toBe(0);
    expect(result.metrics.total).toBeGreaterThan(60);
  });

  it('preserves fixed app shell chrome instead of reflowing it', () => {
    const result = solveDesignLayout({
      frame: { width: 960, height: 620, padding: 32, gap: 20, columns: 12, mode: 'app-shell' },
      elements: [
        { id: 'sidebar', kind: 'group', role: 'support', x: 0, y: 0, width: 96, height: 620, background: '#111827' },
        { id: 'header', kind: 'group', role: 'meta', x: 96, y: 0, width: 864, height: 64, background: '#ffffff' },
        { id: 'content', kind: 'group', role: 'body', x: 120, y: 96, width: 760, height: 468, background: '#f8fafc' }
      ]
    });

    expect(result.elements.find((element) => element.id === 'sidebar')).toMatchObject({ x: 0, y: 0 });
    expect(result.elements.find((element) => element.id === 'header')).toMatchObject({ x: 96, y: 0 });
    expect(result.elements.find((element) => element.id === 'content')).toMatchObject({ x: 120, y: 96 });
    expect(result.metrics.overlapPenalty).toBe(0);
  });

  it('uses heuristic saliency when no importance report is provided', () => {
    const document: DesignDocument = {
      frame: { width: 960, height: 620, padding: 32, gap: 20, columns: 12 },
      background: {
        subjectRegion: { x: 560, y: 40, width: 220, height: 260 }
      },
      elements: [
        { id: 'hero', kind: 'text', role: 'title', x: 72, y: 118, width: 404, height: 138, color: '#151321' },
        { id: 'body', kind: 'text', role: 'body', x: 72, y: 292, width: 344, height: 116, color: '#34314a' },
        { id: 'cta', kind: 'shape', role: 'cta', x: 72, y: 440, width: 182, height: 54, background: '#295dff', color: '#fff' }
      ]
    };

    const fallback = solveDesignLayout(document);
    const explicit = solveDesignLayout(document, {
      importanceReport: analyzeImportance(document, 'heuristic')
    });

    expect(fallback.metrics.total).toBeCloseTo(explicit.metrics.total, 5);
    expect(fallback.elements.map((element) => element.id)).toEqual(explicit.elements.map((element) => element.id));
  });
});
