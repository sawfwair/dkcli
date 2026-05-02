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
    expect(cssOutput).toContain('Overall:');
    expect(JSON.parse(jsonOutput)).toMatchObject({ overall: report.overall });
  });
});
