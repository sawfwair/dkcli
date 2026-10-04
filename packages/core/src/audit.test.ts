import { describe, expect, it } from 'vitest';

import {
  audit,
  extractCssValues,
  fitScale,
  formatAuditCss,
  formatAuditJson
} from './audit.ts';

const sampleCss = `
  body{color:#111111;background:#ffffff;font-size:16px;font-weight:400;padding:8px 16px;border-radius:8px;}
  .card{color:oklch(0.72 0.12 240);background-color:rgb(37, 99, 235);font-size:24px;margin:16px 32px;gap:8px;}
`;

describe('audit', () => {
  it('extracts colors, sizes, spacing, and color pairs from css', () => {
    const extracted = extractCssValues(sampleCss);

    expect(extracted.textColors).toHaveLength(2);
    expect(extracted.bgColors).toHaveLength(2);
    expect(extracted.fontSizes.map((entry) => entry.px)).toEqual([16, 24]);
    expect(extracted.spacings.length).toBeGreaterThan(0);
    expect(extracted.colorPairs).toHaveLength(2);
  });

  it('detects the same contrast failure regardless of declaration order and leading whitespace', () => {
    const colorFirst = audit(`
      .card {
        color: #aaaaaa;
        background: #ffffff;
        font-size: 16px;
      }
    `);
    const backgroundFirst = audit(`
      .card {
        background: #ffffff;
        color: #aaaaaa;
        font-size: 16px;
      }
    `);

    expect(colorFirst.extracted.colorPairs).toEqual(backgroundFirst.extracted.colorPairs);
    expect(colorFirst.extracted.colorPairs).toHaveLength(1);
    expect(colorFirst.categories.find((category) => category.label === 'Contrast')).toEqual(
      backgroundFirst.categories.find((category) => category.label === 'Contrast')
    );
    expect(colorFirst.categories.find((category) => category.label === 'Contrast')?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ severity: 'fail' })])
    );
  });

  it('fits exact scales with low error', () => {
    const fit = fitScale([8, 16, 32]);

    expect(fit.rmse).toBe(0);
    expect(fit.values.map((value) => value.expected)).toEqual([8, 16, 32]);
  });

  it('builds reports and formatter outputs', () => {
    const report = audit(sampleCss);
    const cssOutput = formatAuditCss(report);
    const jsonOutput = formatAuditJson(report);

    expect(report.categories).toHaveLength(6);
    expect(report.overall).toBeGreaterThan(0);
    expect(cssOutput).toContain('Source heuristic score:');
    expect(JSON.parse(jsonOutput)).toMatchObject({ overall: report.overall });
  });
});
