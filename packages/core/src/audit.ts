// Audit — CSS analysis engine. Extracts design values and scores them against dk math.

import { hexToOklch, apcaContrast, apcaCheck, oklchToHex } from './color.ts';
import { RATIOS } from './scale.ts';

// ── Types ───────────────────────────────────────────────────────────────────

export type ExtractedColor = { hex: string; selector: string };
export type ExtractedSize = { px: number; selector: string };
export type ExtractedSpacing = { px: number; property: string; selector: string };
export type ColorPair = { text: string; bg: string; selector: string; fontSize: number; fontWeight: number };

export type ExtractedValues = {
  textColors: ExtractedColor[];
  bgColors: ExtractedColor[];
  fontSizes: ExtractedSize[];
  fontWeights: Array<{ weight: number; selector: string }>;
  fontFamilies: Array<{ family: string; selector: string }>;
  spacings: ExtractedSpacing[];
  borderRadii: Array<{ px: number; selector: string }>;
  colorPairs: ColorPair[];
};

export type Issue = { severity: 'fail' | 'warn' | 'info'; message: string };
export type CategoryScore = { score: number; label: string; summary: string; issues: Issue[] };

export type ScaleFit = {
  ratioName: string;
  ratio: number;
  base: number;
  rmse: number;
  values: Array<{ actual: number; expected: number; step: number; deviation: number }>;
};

export type AuditReport = {
  overall: number;
  categories: CategoryScore[];
  extracted: ExtractedValues;
  bestSpacingScale: ScaleFit | null;
  bestTypeScale: ScaleFit | null;
};

export type RenderedAuditInput = {
  mode: 'rendered';
  source: 'url' | 'html';
  url?: string;
  html?: string;
  viewport?: { width: number; height: number };
  dark?: boolean;
};

export type RenderedAuditReport = AuditReport & {
  mode: 'rendered';
  ruleCount: number;
  selectorCount: number;
};

// ── CSS Value Extraction ────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, c))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function colorToHex(val: string): string | null {
  // Hex
  const hexM = val.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hexM) {
    let h = hexM[1];
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length >= 6) return '#' + h.slice(0, 6).toLowerCase();
  }
  // rgb/rgba
  const rgbM = val.match(/rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/);
  if (rgbM) {
    const [, r, g, b] = rgbM;
    return '#' + [r, g, b].map(c => Number(c).toString(16).padStart(2, '0')).join('');
  }
  // hsl
  const hslM = val.match(/hsla?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%/);
  if (hslM) return hslToHex(Number(hslM[1]), Number(hslM[2]), Number(hslM[3]));
  // oklch
  const oklchM = val.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (oklchM) return oklchToHex(Number(oklchM[1]), Number(oklchM[2]), Number(oklchM[3]));
  return null;
}

function parsePxValue(val: string): number | null {
  const pxM = val.match(/([\d.]+)\s*px/);
  if (pxM) return Number(pxM[1]);
  const remM = val.match(/([\d.]+)\s*rem/);
  if (remM) return Number(remM[1]) * 16;
  const emM = val.match(/([\d.]+)\s*em/);
  if (emM) return Number(emM[1]) * 16;
  return null;
}

function parseSpacingValues(val: string): number[] {
  const parts = val.split(/\s+/).filter(p => !p.includes('auto') && !p.includes('%') && !p.includes('var('));
  return parts.map(parsePxValue).filter((v): v is number => v !== null && v > 0);
}

function resolveWeight(w: string): number {
  const map: Record<string, number> = { normal: 400, bold: 700, lighter: 300, bolder: 600 };
  return map[w.toLowerCase()] ?? (Number(w) || 400);
}

export function extractCssValues(css: string): ExtractedValues {
  // Strip @keyframes and @font-face blocks
  const cleaned = css
    .replace(/@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')
    .replace(/@font-face\s*\{[^}]*\}/g, '');

  const textColors: ExtractedColor[] = [];
  const bgColors: ExtractedColor[] = [];
  const fontSizes: ExtractedSize[] = [];
  const fontWeights: Array<{ weight: number; selector: string }> = [];
  const fontFamilies: Array<{ family: string; selector: string }> = [];
  const spacings: ExtractedSpacing[] = [];
  const borderRadii: Array<{ px: number; selector: string }> = [];
  const colorPairs: ColorPair[] = [];

  // Split into rule blocks
  const ruleRe = /([^{}]*?)\{([^{}]*?)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRe.exec(cleaned)) !== null) {
    const selector = match[1].trim().split('\n').pop()?.trim() || '';
    const body = match[2];

    let textHex: string | null = null;
    let bgHex: string | null = null;
    let fSize = 16;
    let fWeight = 400;

    // Text color
    const colorM = body.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
    if (colorM) {
      const hex = colorToHex(colorM[1]);
      if (hex) { textColors.push({ hex, selector }); textHex = hex; }
    }

    // Background color
    const bgM = body.match(/(?:background-color|background)\s*:\s*([^;]+)/i);
    if (bgM && !bgM[1].includes('url(') && !bgM[1].includes('gradient')) {
      const hex = colorToHex(bgM[1]);
      if (hex) { bgColors.push({ hex, selector }); bgHex = hex; }
    }

    // Font size
    const fsM = body.match(/font-size\s*:\s*([^;]+)/i);
    if (fsM) {
      const px = parsePxValue(fsM[1]);
      if (px && px > 0) { fontSizes.push({ px, selector }); fSize = px; }
    }

    // Font weight
    const fwM = body.match(/font-weight\s*:\s*(\w+)/i);
    if (fwM) { const w = resolveWeight(fwM[1]); fontWeights.push({ weight: w, selector }); fWeight = w; }

    // Font family
    const ffM = body.match(/font-family\s*:\s*([^;]+)/i);
    if (ffM) {
      const family = ffM[1].split(',')[0].trim().replace(/["']/g, '');
      if (family && !['serif', 'sans-serif', 'monospace', 'cursive', 'system-ui', 'inherit'].includes(family.toLowerCase())) {
        fontFamilies.push({ family, selector });
      }
    }

    // Spacing (margin, padding, gap)
    for (const prop of ['margin', 'padding', 'gap']) {
      const re = new RegExp(`${prop}(?:-(top|right|bottom|left))?\\s*:\\s*([^;]+)`, 'gi');
      let sm: RegExpExecArray | null;
      while ((sm = re.exec(body)) !== null) {
        const vals = parseSpacingValues(sm[2]);
        for (const px of vals) spacings.push({ px, property: prop, selector });
      }
    }

    // Border radius
    const brM = body.match(/border-radius\s*:\s*([^;]+)/i);
    if (brM) {
      const vals = parseSpacingValues(brM[1]);
      for (const px of vals) borderRadii.push({ px, selector });
    }

    // Color pair
    if (textHex) {
      colorPairs.push({ text: textHex, bg: bgHex || '#ffffff', selector, fontSize: fSize, fontWeight: fWeight });
    }
  }

  return { textColors, bgColors, fontSizes, fontWeights, fontFamilies, spacings, borderRadii, colorPairs };
}

// ── Scale Fitting ───────────────────────────────────────────────────────────

export function fitScale(values: number[]): ScaleFit {
  const sorted = [...new Set(values.map(v => Math.round(v * 2) / 2))].sort((a, b) => a - b).filter(v => v > 0);
  if (sorted.length < 2) return { ratioName: 'none', ratio: 1, base: sorted[0] || 16, rmse: 0, values: [] };

  let best: ScaleFit = { ratioName: 'none', ratio: 1, base: 16, rmse: Infinity, values: [] };

  const allRatios = Object.entries(RATIOS);

  for (const [name, ratio] of allRatios) {
    // Estimate base from each value
    const baseEstimates = sorted.map(v => {
      const logStep = Math.log(v) / Math.log(ratio);
      return v / Math.pow(ratio, Math.round(logStep));
    });
    const medianBase = baseEstimates.sort((a, b) => a - b)[Math.floor(baseEstimates.length / 2)];

    // Search around the median estimate
    for (let base = Math.max(1, medianBase - 4); base <= medianBase + 4; base += 0.5) {
      const mappedValues = sorted.map(v => {
        const step = Math.round(Math.log(v / base) / Math.log(ratio));
        const expected = base * Math.pow(ratio, step);
        const deviation = Math.abs(v - expected);
        return { actual: v, expected: parseFloat(expected.toFixed(1)), step, deviation: parseFloat(deviation.toFixed(1)) };
      });

      const rmse = Math.sqrt(mappedValues.reduce((s, m) => s + m.deviation * m.deviation, 0) / mappedValues.length);

      if (rmse < best.rmse) {
        best = { ratioName: name, ratio, base: parseFloat(base.toFixed(1)), rmse: parseFloat(rmse.toFixed(2)), values: mappedValues };
      }
    }
  }

  return best;
}

// ── Scoring Functions ───────────────────────────────────────────────────────

export function scoreColorCoherence(values: ExtractedValues): CategoryScore {
  const allHexes = [...new Set([...values.textColors.map(c => c.hex), ...values.bgColors.map(c => c.hex)])];
  if (allHexes.length === 0) return { score: 5, label: 'Color', summary: 'No colors detected', issues: [] };

  const oklchColors = allHexes.map(hex => ({ hex, oklch: hexToOklch(hex) }));
  const chromatic = oklchColors.filter(c => c.oklch[1] > 0.03);
  const achromatic = oklchColors.filter(c => c.oklch[1] <= 0.03);

  if (chromatic.length === 0) return { score: 7, label: 'Color', summary: `${allHexes.length} colors, all achromatic`, issues: [] };

  // Cluster hues
  const hues = chromatic.map(c => c.oklch[2]).sort((a, b) => a - b);
  const clusters: number[][] = [[hues[0]]];
  for (let i = 1; i < hues.length; i++) {
    const gap = hues[i] - hues[i - 1];
    if (gap > 30) clusters.push([hues[i]]);
    else clusters[clusters.length - 1].push(hues[i]);
  }
  const centroids = clusters.map(c => c.reduce((s, h) => s + h, 0) / c.length);

  // Check harmony patterns
  const HARMONIES: Record<string, number[]> = {
    complementary: [0, 180], analogous: [-30, 0, 30], triadic: [0, 120, 240],
    'split-comp': [0, 150, 210], tetradic: [0, 90, 180, 270],
  };

  let bestHarmony = 'none';
  let bestError = 1;

  for (const [name, offsets] of Object.entries(HARMONIES)) {
    if (centroids.length > offsets.length) continue;
    for (const anchor of centroids) {
      const expected = offsets.map(o => (anchor + o) % 360);
      let totalErr = 0;
      for (const c of centroids) {
        const minDist = Math.min(...expected.map(e => {
          const d = Math.abs(c - e);
          return Math.min(d, 360 - d);
        }));
        totalErr += (minDist / 180) * (minDist / 180);
      }
      const err = totalErr / centroids.length;
      if (err < bestError) { bestError = err; bestHarmony = name; }
    }
  }

  let score = 10 * (1 - Math.min(bestError, 1));

  // Neutral tinting bonus
  if (achromatic.length > 0) {
    const tintedCount = achromatic.filter(c => c.oklch[1] > 0.003).length;
    if (tintedCount > achromatic.length * 0.5) score = Math.min(10, score + 0.5);
  }

  // Compactness penalty
  if (centroids.length > 6) score = Math.max(0, score - (centroids.length - 6) * 0.5);

  const issues: Issue[] = [];
  if (bestError > 0.3) issues.push({ severity: 'warn', message: `No clear color harmony detected (best: ${bestHarmony}, error ${bestError.toFixed(2)})` });

  return {
    score: parseFloat(score.toFixed(1)),
    label: 'Color',
    summary: `${centroids.length} hue${centroids.length !== 1 ? 's' : ''}, ${bestHarmony} harmony, ${achromatic.length} neutrals`,
    issues,
  };
}

export function scoreContrast(values: ExtractedValues): CategoryScore {
  if (values.colorPairs.length === 0) return { score: 5, label: 'Contrast', summary: 'No text/bg pairs detected', issues: [] };

  let passing = 0;
  const issues: Issue[] = [];

  for (const pair of values.colorPairs) {
    const result = apcaContrast(pair.text, pair.bg);
    const check = apcaCheck(result.Lc, pair.fontSize, pair.fontWeight);
    if (check.pass) {
      passing++;
    } else {
      issues.push({
        severity: 'fail',
        message: `${pair.text} on ${pair.bg} at ${pair.fontSize}px/${pair.fontWeight} — Lc ${result.abs} < ${check.minLc}`,
      });
    }
  }

  const score = parseFloat((10 * passing / values.colorPairs.length).toFixed(1));
  return {
    score,
    label: 'Contrast',
    summary: `${passing}/${values.colorPairs.length} pairs pass APCA`,
    issues,
  };
}

export function scoreSpacing(values: ExtractedValues): CategoryScore {
  const unique = [...new Set(values.spacings.map(s => Math.round(s.px * 2) / 2))].filter(v => v > 0);
  if (unique.length < 3) return { score: 5, label: 'Spacing', summary: `${unique.length} spacing values — insufficient data`, issues: [] };

  const fit = fitScale(unique);
  const score = parseFloat(Math.max(0, Math.min(10, 10 * (1 - fit.rmse / 8))).toFixed(1));
  const issues: Issue[] = fit.values
    .filter(v => v.deviation > 2)
    .map(v => ({ severity: 'warn' as const, message: `${v.actual}px off scale (expected ${v.expected}px, Δ${v.deviation}px)` }));

  return {
    score,
    label: 'Spacing',
    summary: `best fit: ${fit.ratioName}(${fit.base}px), avg Δ${fit.rmse}px`,
    issues,
  };
}

export function scoreTypography(values: ExtractedValues): CategoryScore {
  const unique = [...new Set(values.fontSizes.map(s => Math.round(s.px * 2) / 2))].filter(v => v > 0).sort((a, b) => a - b);
  if (unique.length < 2) return { score: 5, label: 'Typography', summary: `${unique.length} font size — insufficient data`, issues: [] };

  const fit = fitScale(unique);
  let score = Math.max(0, Math.min(10, 10 * (1 - fit.rmse / 6)));

  // Check for muddy sizes (ratio < 1.1 between adjacent)
  const issues: Issue[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    const ratio = unique[i + 1] / unique[i];
    if (ratio < 1.1) {
      issues.push({ severity: 'warn', message: `${unique[i]}px and ${unique[i + 1]}px too close (ratio ${ratio.toFixed(2)})` });
      score = Math.max(0, score - 1);
    }
  }

  return {
    score: parseFloat(score.toFixed(1)),
    label: 'Typography',
    summary: `${unique.length} sizes, best fit: ${fit.ratioName}(${fit.base}px)`,
    issues,
  };
}

export function scoreConsistency(values: ExtractedValues): CategoryScore {
  const uniqueColors = [...new Set([...values.textColors.map(c => c.hex), ...values.bgColors.map(c => c.hex)])];
  const uniqueSpacings = [...new Set(values.spacings.map(s => Math.round(s.px * 2) / 2))].filter(v => v > 0);
  const uniqueSizes = [...new Set(values.fontSizes.map(s => Math.round(s.px * 2) / 2))];
  const uniqueRadii = [...new Set(values.borderRadii.map(r => Math.round(r.px)))];

  let score = 10;
  const issues: Issue[] = [];

  // Near-duplicate colors (OKLCH distance < 0.05)
  let nearDupeColors = 0;
  for (let i = 0; i < uniqueColors.length; i++) {
    for (let j = i + 1; j < uniqueColors.length; j++) {
      const [l1, c1] = hexToOklch(uniqueColors[i]);
      const [l2, c2] = hexToOklch(uniqueColors[j]);
      const dist = Math.sqrt((l1 - l2) ** 2 + (c1 - c2) ** 2);
      if (dist < 0.05 && dist > 0.001) {
        nearDupeColors++;
        if (nearDupeColors <= 3) issues.push({ severity: 'warn', message: `Near-duplicate colors: ${uniqueColors[i]} ≈ ${uniqueColors[j]}` });
      }
    }
  }

  // Near-duplicate spacings (within 1px)
  let nearDupeSpacing = 0;
  const sortedSpacing = uniqueSpacings.sort((a, b) => a - b);
  for (let i = 0; i < sortedSpacing.length - 1; i++) {
    if (sortedSpacing[i + 1] - sortedSpacing[i] <= 1 && sortedSpacing[i + 1] - sortedSpacing[i] > 0) {
      nearDupeSpacing++;
      issues.push({ severity: 'warn', message: `Near-duplicate spacing: ${sortedSpacing[i]}px ≈ ${sortedSpacing[i + 1]}px` });
    }
  }

  score -= nearDupeColors * 0.4;
  score -= nearDupeSpacing * 0.5;
  if (uniqueColors.length > 20) score -= (uniqueColors.length - 20) * 0.2;
  if (uniqueSpacings.length > 15) score -= (uniqueSpacings.length - 15) * 0.3;

  return {
    score: parseFloat(Math.max(0, Math.min(10, score)).toFixed(1)),
    label: 'Consistency',
    summary: `${uniqueColors.length} colors${nearDupeColors > 0 ? ` (${nearDupeColors} near-dupes)` : ''}, ${uniqueSpacings.length} spacings, ${uniqueSizes.length} font sizes, ${uniqueRadii.length} radii`,
    issues,
  };
}

export function scoreGridAlignment(values: ExtractedValues): CategoryScore {
  const allPx = [
    ...values.spacings.map(s => s.px),
    ...values.borderRadii.map(r => r.px),
  ].filter(v => v > 0);

  if (allPx.length < 3) return { score: 5, label: 'Grid', summary: 'Insufficient data', issues: [] };

  let bestBase = 4;
  let bestPct = 0;

  for (const base of [4, 6, 8, 10, 12]) {
    const aligned = allPx.filter(v => Math.abs(v % base) < 0.5 || Math.abs(v % base - base) < 0.5).length;
    const pct = aligned / allPx.length;
    if (pct > bestPct) { bestPct = pct; bestBase = base; }
  }

  const score = parseFloat((10 * bestPct).toFixed(1));
  const issues: Issue[] = [];
  if (bestPct < 0.8) {
    const offGrid = allPx.filter(v => Math.abs(v % bestBase) >= 0.5 && Math.abs(v % bestBase - bestBase) >= 0.5);
    const unique = [...new Set(offGrid.map(v => Math.round(v * 10) / 10))].slice(0, 5);
    issues.push({ severity: 'warn', message: `Off-grid values: ${unique.join(', ')}px` });
  }

  return {
    score,
    label: 'Grid',
    summary: `${Math.round(bestPct * 100)}% on ${bestBase}px grid`,
    issues,
  };
}

// ── Main Audit Function ────────────────────────────────────────────────────

export function audit(css: string): AuditReport {
  const extracted = extractCssValues(css);

  const categories = [
    scoreColorCoherence(extracted),
    scoreContrast(extracted),
    scoreSpacing(extracted),
    scoreTypography(extracted),
    scoreConsistency(extracted),
    scoreGridAlignment(extracted),
  ];

  const weights = [0.20, 0.25, 0.15, 0.15, 0.15, 0.10];
  const overall = Math.round(categories.reduce((sum, cat, i) => sum + cat.score * weights[i], 0) * 10);

  const uniqueSpacings = [...new Set(extracted.spacings.map(s => Math.round(s.px * 2) / 2))].filter(v => v > 0);
  const uniqueSizes = [...new Set(extracted.fontSizes.map(s => Math.round(s.px * 2) / 2))].filter(v => v > 0);

  return {
    overall: Math.min(100, Math.max(0, overall)),
    categories,
    extracted,
    bestSpacingScale: uniqueSpacings.length >= 3 ? fitScale(uniqueSpacings) : null,
    bestTypeScale: uniqueSizes.length >= 2 ? fitScale(uniqueSizes) : null,
  };
}

// ── Formatters ──────────────────────────────────────────────────────────────

export function formatAuditCss(report: AuditReport): string {
  const lines = [`/* dk audit — Design Analysis */`, `/* Overall: ${report.overall}/100 */`, `/*`];
  for (const cat of report.categories) {
    lines.push(` * ${cat.label.padEnd(14)} ${cat.score.toFixed(1)}/10  ${cat.summary}`);
  }
  const allIssues = report.categories.flatMap(c => c.issues);
  if (allIssues.length > 0) {
    lines.push(` *`);
    lines.push(` * Issues:`);
    allIssues.slice(0, 10).forEach((issue, i) => {
      lines.push(` * ${i + 1}. ${issue.severity.toUpperCase()}: ${issue.message}`);
    });
    if (allIssues.length > 10) lines.push(` * ... and ${allIssues.length - 10} more`);
  }
  lines.push(` */`);
  return lines.join('\n');
}

export function formatAuditJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

export function auditRenderedCss(css: string): RenderedAuditReport {
  const report = audit(css);
  const ruleCount = (css.match(/\{/g) ?? []).length;
  const selectorCount = (css.match(/[^{}]+\{/g) ?? []).length;
  return {
    ...report,
    mode: 'rendered',
    ruleCount,
    selectorCount
  };
}
