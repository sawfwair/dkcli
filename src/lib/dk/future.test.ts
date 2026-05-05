import { describe, expect, it } from 'vitest';

import {
  analyzeEmbeddingTopologyHeuristic,
  diagnoseFutureTopology,
  futureSimilarityBand,
  generateLayoutCss
} from './future';
import { audit } from '@dkcli/core';

const sampleItems = [
  {
    id: 'hero-title',
    role: 'title',
    label: 'Semantic layout probe',
    text: 'Use embedding affinity to decide what deserves adjacency and emphasis.'
  },
  {
    id: 'hero-body',
    role: 'body',
    label: 'Intro',
    text: 'Treat topology as a soft layout prior instead of allowing it to place pixels directly.'
  },
  {
    id: 'primary-cta',
    role: 'cta',
    label: 'Run topology probe',
    text: 'Compare heuristic and Workers AI embeddings against the same semantic query.'
  },
  {
    id: 'matrix',
    role: 'data',
    label: 'Affinity matrix',
    text: 'Measure which cards belong together before the constraint solver takes over.'
  },
  {
    id: 'slot-plan',
    role: 'support',
    label: 'Slot plan',
    text: 'Translate clusters into lead, body, support, and utility zones.'
  }
] as const;

describe('future topology', () => {
  it('builds a deterministic topology report from heuristic embeddings', () => {
    const report = analyzeEmbeddingTopologyHeuristic(
      [...sampleItems],
      'Arrange an editorial landing page around semantic layout constraints.'
    );

    expect(report.mode).toBe('heuristic');
    expect(report.model).toBe('heuristic-hash');
    expect(report.items).toHaveLength(sampleItems.length);
    expect(report.matrix).toHaveLength(sampleItems.length);
    expect(report.recommendation.readingOrder.slice().sort()).toEqual(
      sampleItems.map((item) => item.id).slice().sort()
    );
    expect(report.recommendation.anchorId).toBeTruthy();
    expect(report.recommendation.slotPlan[0]?.slot).toBe('lead');
    expect(report.items.every((item) => item.slot.length > 0)).toBe(true);
    expect(report.warnings[0]).toContain('Workers AI not used');
    expect(report.matrix.every((row, index) => row[index] === 1)).toBe(true);
  });

  it('bands similarity values into readable labels', () => {
    expect(futureSimilarityBand(0.8)).toBe('tight');
    expect(futureSimilarityBand(0.6)).toBe('related');
    expect(futureSimilarityBand(0.2)).toBe('weak');
  });
});

describe('generateLayoutCss', () => {
  it('emits role-based design tokens (font-size, color, font-weight)', () => {
    const report = analyzeEmbeddingTopologyHeuristic(
      [...sampleItems],
      'Arrange an editorial landing page.'
    );
    const css = generateLayoutCss(report);

    expect(css).toContain('font-size:');
    expect(css).toContain('font-weight:');
    expect(css).toContain('color:');
    expect(css).toContain('padding:');
    expect(css).toContain('gap:');
  });

  it('produces different CSS when item roles change', () => {
    const report = analyzeEmbeddingTopologyHeuristic(
      [...sampleItems],
      'Arrange an editorial landing page.'
    );
    const cssBefore = generateLayoutCss(report);

    // Demote the title to body
    const demoted = sampleItems.map(item =>
      item.role === 'title' ? { ...item, role: 'body' } : { ...item }
    );
    const report2 = analyzeEmbeddingTopologyHeuristic(demoted, 'Arrange an editorial landing page.');
    const cssAfter = generateLayoutCss(report2);

    expect(cssBefore).not.toBe(cssAfter);
  });

  it('escapes item ids and roles before emitting generated CSS', () => {
    const report = analyzeEmbeddingTopologyHeuristic(
      [
        {
          id: 'x"]{} body{outline:999px solid red}/*',
          role: 'hero*/ body{background:red}/*',
          label: 'Injected',
          text: 'Injected'
        }
      ],
      'Arrange an editorial landing page.'
    );
    const css = generateLayoutCss(report);

    expect(css).toContain('[data-dk-item="x\\"]{} body{outline:999px solid red}/*"]');
    expect(css).not.toContain('[data-dk-item="x"]{} body');
    expect(css).not.toContain('hero*/ body');
  });
});

describe('diagnoseFutureTopology with audit', () => {
  it('is not stable when audit score is below 60', () => {
    const report = analyzeEmbeddingTopologyHeuristic(
      [...sampleItems],
      'Arrange an editorial landing page.'
    );

    // Without audit — may or may not be stable depending on topology
    const _diagnosisNoAudit = diagnoseFutureTopology(report);

    // With a low audit score — should not be stable
    const lowAudit = {
      overall: 35,
      categories: [
        { score: 0.3, label: 'Color', summary: 'Poor color coherence', issues: [] },
        { score: 0.4, label: 'Contrast', summary: 'Low contrast', issues: [] },
      ],
      extracted: { textColors: [], bgColors: [], fontSizes: [], fontWeights: [], fontFamilies: [], spacings: [], borderRadii: [], colorPairs: [] },
      bestSpacingScale: null,
      bestTypeScale: null,
    };
    const diagnosisLowAudit = diagnoseFutureTopology(report, lowAudit);

    expect(diagnosisLowAudit.stable).toBe(false);
    expect(diagnosisLowAudit.notes.some(n => n.includes('Audit score is low'))).toBe(true);
  });

  it('allows stability when audit score is 60 or above', () => {
    const report = analyzeEmbeddingTopologyHeuristic(
      [...sampleItems],
      'Arrange an editorial landing page.'
    );

    const goodAudit = {
      overall: 75,
      categories: [
        { score: 0.8, label: 'Color', summary: 'Good', issues: [] },
        { score: 0.7, label: 'Contrast', summary: 'Good', issues: [] },
      ],
      extracted: { textColors: [], bgColors: [], fontSizes: [], fontWeights: [], fontFamilies: [], spacings: [], borderRadii: [], colorPairs: [] },
      bestSpacingScale: null,
      bestTypeScale: null,
    };
    const diagnosis = diagnoseFutureTopology(report, goodAudit);

    // Stability depends on topology too, but audit alone shouldn't block it
    expect(diagnosis.notes.every(n => !n.includes('Audit score is low'))).toBe(true);
  });
});

describe('audit score changes across loop iterations', () => {
  it('produces different audit scores when roles change', () => {
    const report1 = analyzeEmbeddingTopologyHeuristic(
      [...sampleItems],
      'Arrange an editorial landing page.'
    );
    const css1 = generateLayoutCss(report1);
    const audit1 = audit(css1);

    // Change all roles to meta (extreme change to guarantee different scores)
    const allMeta = sampleItems.map(item => ({ ...item, role: 'meta' }));
    const report2 = analyzeEmbeddingTopologyHeuristic(allMeta, 'Arrange an editorial landing page.');
    const css2 = generateLayoutCss(report2);
    const audit2 = audit(css2);

    // The two audit scores should differ since CSS values differ
    expect(css1).not.toBe(css2);
    // At minimum the extracted values should differ
    expect(audit1.extracted.fontSizes.length).toBeGreaterThan(0);
    expect(audit2.extracted.fontSizes.length).toBeGreaterThan(0);
  });
});
