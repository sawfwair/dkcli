import {
  analyzeImportance,
  analyzeTargetAcquisition,
  scoreComposition,
  scoreDesignComposition,
  solveDesignLayout,
  solveStackLayout,
  type DesignDocument,
  type LayoutItem
} from '@dkcli/core';
import { apcaCheck, apcaContrast, autoContrastAPCA, type ColorResult } from './color.ts';
import { generateSpring, SPRING_PRESETS } from './ease.ts';
import type { ContainmentReport, PlanFitReport } from './fit.ts';
import { generateGlassCss } from './glass.ts';
import { generateMinimumJerk } from './jerk.ts';
import { balanceLines, flowLinesByWidth, greedyBreak } from './linebreak.ts';
import { getCorrections } from './optical.ts';
import { STOPS, generateHarmony, optimizePalette } from './palette.ts';
import { analyzeDistinctness } from './perception.ts';
import { generateFluidScale, RATIOS } from './scale.ts';
import { recommendTypography } from './typography.ts';
import { typesetParagraph } from './typeset.ts';

type SemanticValue = string | ColorResult;

export type PerfectMode = 'light' | 'dark';
export type PerfectBreakMode = 'none' | 'select-overflow' | 'layout-drift' | 'both';
export type PerfectDiagnosticStage = 'input' | 'compile' | 'render';
export type PerfectDiagnosticSeverity = 'error' | 'warning';

export type PerfectProofCard = {
  label: string;
  fg: string;
  bg: string;
  lc: number;
  minLc: number;
  recommendation: string;
  pass: boolean;
};

export type PerfectSpec = {
  baseColorInput: string;
  ratioName: string;
  mode: PerfectMode;
  motionPreset: string;
};

export type PerfectNormalizedSpec = {
  baseColorInput: string;
  baseColor: string;
  ratioName: string;
  mode: PerfectMode;
  motionPreset: string;
};

export type PerfectDiagnostic = {
  id: string;
  label: string;
  stage: PerfectDiagnosticStage;
  severity: PerfectDiagnosticSeverity;
  pass: boolean;
  expected: string;
  actual: string;
  delta?: number;
  unit?: string;
  details: string;
};

export type PerfectCompileReport = {
  ok: boolean;
  score: number;
  diagnostics: PerfectDiagnostic[];
  failures: PerfectDiagnostic[];
  passCount: number;
  failCount: number;
};

export type PerfectVerificationReport = {
  ready: boolean;
  ok: boolean;
  score: number | null;
  diagnostics: PerfectDiagnostic[];
  failures: PerfectDiagnostic[];
  metrics: {
    controlScore: number | null;
    layoutScore: number | null;
    score: number | null;
    overflowCount: number;
    mismatchCount: number;
    missingCount: number;
  };
};

export type PerfectOutputs = {
  optimizedPalette: ReturnType<typeof optimizePalette>;
  tonal: ReturnType<typeof optimizePalette>['tonal'];
  neutral: ReturnType<typeof optimizePalette>['neutral'];
  semantic: NonNullable<ReturnType<typeof optimizePalette>['light']>;
  harmony: ReturnType<typeof generateHarmony>;
  fluid: ReturnType<typeof generateFluidScale>;
  motion: ReturnType<typeof generateSpring>;
  motionCurve: string;
  circleCorrections: ReturnType<typeof getCorrections>;
  iconCorrections: ReturnType<typeof getCorrections>;
  iconTransform: string;
  correctedCircleSize: string;
  glassCss: string;
  swatches: Array<{
    stop: number;
    color: ColorResult;
    onColor: string;
    lc: number;
  }>;
  proofCards: PerfectProofCard[];
  maxScalePx: number;
  surfaceHex: string;
  surfaceInk: string;
  primaryHex: string;
  onPrimaryHex: string;
  outlineHex: string;
  proofMeasure: number;
  layoutGap: number;
  layoutPadding: number;
  proofLayoutPlan: LayoutItem[];
  layoutProof: ReturnType<typeof solveStackLayout>;
  layoutRects: Array<{ id: string; x: number; y: number; width: number; height: number }>;
  basicComposition: ReturnType<typeof scoreComposition>;
  proofDocument: DesignDocument;
  proofImportance: ReturnType<typeof analyzeImportance>;
  advancedLayout: ReturnType<typeof solveDesignLayout>;
  composition: ReturnType<typeof scoreDesignComposition>;
  distinctness: ReturnType<typeof analyzeDistinctness>;
  targetProof: ReturnType<typeof analyzeTargetAcquisition>;
  typography: ReturnType<typeof recommendTypography>;
  linebreakText: string;
  balancedBreak: ReturnType<typeof balanceLines>;
  greedyBreakResult: ReturnType<typeof greedyBreak>;
  advancedBreak: ReturnType<typeof typesetParagraph>;
  advancedFlow: ReturnType<typeof flowLinesByWidth>;
  jerkProof: ReturnType<typeof generateMinimumJerk>;
  jerkPoints: string;
};

export type PerfectCompileResult = {
  spec: PerfectNormalizedSpec;
  outputs: PerfectOutputs;
  report: PerfectCompileReport;
};

export type PerfectRenderMeasurements = {
  controlFit: ContainmentReport | null;
  layoutFit: PlanFitReport | null;
};

const HEX_PATTERN = /^#(?:[0-9a-f]{6})$/i;
const DEFAULT_BASE_COLOR = '#295dff';
const DEFAULT_RATIO = 'perfect-fourth';
const DEFAULT_MOTION = 'snappy';
const MIN_DISTINCT_BASE = 20;
const MIN_DISTINCT_CVD = 15;

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function hexOf(value: SemanticValue): string {
  return typeof value === 'string' ? value : value.hex;
}

function buildProof(label: string, fg: string, bg: string, size: number, weight: number): PerfectProofCard {
  const contrast = apcaContrast(fg, bg);
  const verdict = apcaCheck(contrast.Lc, size, weight);
  return {
    label,
    fg,
    bg,
    lc: contrast.abs,
    minLc: verdict.minLc,
    recommendation: verdict.recommendation,
    pass: verdict.pass
  };
}

function joinTransforms(values: Array<{ property: string; value: string }>): string {
  return values
    .filter((item) => item.property === 'transform')
    .map((item) => item.value)
    .join(' ');
}

function correctionValue(
  values: Array<{ property: string; value: string }>,
  property: string,
  fallback: string
): string {
  return values.find((item) => item.property === property)?.value ?? fallback;
}

function createDiagnostic(options: PerfectDiagnostic): PerfectDiagnostic {
  return options;
}

function buildCompileReport(diagnostics: PerfectDiagnostic[]): PerfectCompileReport {
  const failures = diagnostics.filter((diagnostic) => !diagnostic.pass && diagnostic.severity === 'error');
  const passCount = diagnostics.filter((diagnostic) => diagnostic.pass).length;
  const failCount = failures.length;
  const score = Math.round(clamp01(passCount / Math.max(diagnostics.length, 1)) * 100);

  return {
    ok: failCount === 0,
    score,
    diagnostics,
    failures,
    passCount,
    failCount
  };
}

function pxStep(scale: PerfectOutputs['fluid']['scale'], name: string, fallback: number): number {
  return scale.find((step) => step.name === name)?.pxMax ?? fallback;
}

function normalizeSpec(spec: PerfectSpec): {
  normalized: PerfectNormalizedSpec;
  diagnostics: PerfectDiagnostic[];
} {
  const baseColorValid = HEX_PATTERN.test(spec.baseColorInput);
  const ratioValid = Object.hasOwn(RATIOS, spec.ratioName);
  const motionValid = Object.hasOwn(SPRING_PRESETS, spec.motionPreset);

  const diagnostics: PerfectDiagnostic[] = [
    createDiagnostic({
      id: 'input.base-color',
      label: 'Seed color',
      stage: 'input',
      severity: 'error',
      pass: baseColorValid,
      expected: '#rrggbb',
      actual: spec.baseColorInput,
      details: baseColorValid
        ? 'Seed color matches the required 6-digit hex format.'
        : 'Seed must be a 6-digit hex color so the proof compiles from a stable color input.'
    }),
    createDiagnostic({
      id: 'input.ratio',
      label: 'Scale ratio',
      stage: 'input',
      severity: 'error',
      pass: ratioValid,
      expected: Object.keys(RATIOS).join(', '),
      actual: spec.ratioName,
      details: ratioValid
        ? 'Scale ratio resolves to a known dk modular scale.'
        : 'Scale ratio must match a named dk ratio so the solver uses a defined ladder.'
    }),
    createDiagnostic({
      id: 'input.motion',
      label: 'Motion preset',
      stage: 'input',
      severity: 'error',
      pass: motionValid,
      expected: Object.keys(SPRING_PRESETS).join(', '),
      actual: spec.motionPreset,
      details: motionValid
        ? 'Motion preset resolves to a known spring profile.'
        : 'Motion preset must match a named dk spring preset so the proof uses a defined curve.'
    })
  ];

  return {
    normalized: {
      baseColorInput: spec.baseColorInput,
      baseColor: baseColorValid ? spec.baseColorInput : DEFAULT_BASE_COLOR,
      ratioName: ratioValid ? spec.ratioName : DEFAULT_RATIO,
      mode: spec.mode,
      motionPreset: motionValid ? spec.motionPreset : DEFAULT_MOTION
    },
    diagnostics
  };
}

function buildCompileDiagnostics(
  normalized: PerfectNormalizedSpec,
  outputs: PerfectOutputs,
  inputDiagnostics: PerfectDiagnostic[]
): PerfectDiagnostic[] {
  const [bodyProof, primaryProof, signalProof] = outputs.proofCards;

  return [
    ...inputDiagnostics,
    createDiagnostic({
      id: 'compile.contrast.body',
      label: 'Body contrast',
      stage: 'compile',
      severity: 'error',
      pass: bodyProof.pass,
      expected: `Lc >= ${bodyProof.minLc}`,
      actual: `Lc ${bodyProof.lc}`,
      delta: parseFloat((bodyProof.lc - bodyProof.minLc).toFixed(2)),
      unit: 'Lc',
      details: bodyProof.recommendation
    }),
    createDiagnostic({
      id: 'compile.contrast.primary',
      label: 'Primary contrast',
      stage: 'compile',
      severity: 'error',
      pass: primaryProof.pass,
      expected: `Lc >= ${primaryProof.minLc}`,
      actual: `Lc ${primaryProof.lc}`,
      delta: parseFloat((primaryProof.lc - primaryProof.minLc).toFixed(2)),
      unit: 'Lc',
      details: primaryProof.recommendation
    }),
    createDiagnostic({
      id: 'compile.contrast.signal',
      label: 'Signal contrast',
      stage: 'compile',
      severity: 'error',
      pass: signalProof.pass,
      expected: `Lc >= ${signalProof.minLc}`,
      actual: `Lc ${signalProof.lc}`,
      delta: parseFloat((signalProof.lc - signalProof.minLc).toFixed(2)),
      unit: 'Lc',
      details: signalProof.recommendation
    }),
    createDiagnostic({
      id: 'compile.layout.stack-overflow',
      label: 'Stack overflow',
      stage: 'compile',
      severity: 'error',
      pass: outputs.layoutProof.metrics.overflow === 0,
      expected: '0px',
      actual: `${outputs.layoutProof.metrics.overflow}px`,
      delta: outputs.layoutProof.metrics.overflow,
      unit: 'px',
      details: 'The one-dimensional proof rail should solve within its available measure without overflow.'
    }),
    createDiagnostic({
      id: 'compile.layout.overlap',
      label: 'Advanced overlap',
      stage: 'compile',
      severity: 'warning',
      pass: outputs.advancedLayout.metrics.overlapPenalty <= 4000,
      expected: '<= 4000 overlap penalty',
      actual: `${outputs.advancedLayout.metrics.overlapPenalty}`,
      delta: outputs.advancedLayout.metrics.overlapPenalty - 4000,
      details: 'The document solver should produce non-overlapping geometry for the proof document.'
    }),
    createDiagnostic({
      id: 'compile.layout.safe-region',
      label: 'Safe-region penalty',
      stage: 'compile',
      severity: 'warning',
      pass: outputs.advancedLayout.metrics.safeRegionPenalty <= 7000,
      expected: '<= 7000 safe-region penalty',
      actual: `${outputs.advancedLayout.metrics.safeRegionPenalty}`,
      delta: outputs.advancedLayout.metrics.safeRegionPenalty - 7000,
      details: 'The document solver should keep important elements out of the protected regions.'
    }),
    createDiagnostic({
      id: 'compile.distinct.base',
      label: 'Base distinctness',
      stage: 'compile',
      severity: 'error',
      pass: outputs.distinctness.minDeltaE >= MIN_DISTINCT_BASE,
      expected: `>= ${MIN_DISTINCT_BASE}`,
      actual: `${outputs.distinctness.minDeltaE}`,
      delta: parseFloat((outputs.distinctness.minDeltaE - MIN_DISTINCT_BASE).toFixed(2)),
      details: 'Semantic colors should stay perceptually separated in the base observer model.'
    }),
    createDiagnostic({
      id: 'compile.distinct.deutan',
      label: 'Deutan distinctness',
      stage: 'compile',
      severity: 'error',
      pass: outputs.distinctness.cvd.deutan.minDeltaE >= MIN_DISTINCT_CVD,
      expected: `>= ${MIN_DISTINCT_CVD}`,
      actual: `${outputs.distinctness.cvd.deutan.minDeltaE}`,
      delta: parseFloat((outputs.distinctness.cvd.deutan.minDeltaE - MIN_DISTINCT_CVD).toFixed(2)),
      details: 'Semantic colors should stay meaningfully separated under deuteranopia simulation.'
    }),
    createDiagnostic({
      id: 'compile.typography.crowding',
      label: 'Crowding risk',
      stage: 'compile',
      severity: 'warning',
      pass: outputs.typography.crowdingRisk !== 'high',
      expected: 'low or moderate',
      actual: outputs.typography.crowdingRisk,
      details: 'Readable proof text should not end up in a high-crowding state.'
    }),
    createDiagnostic({
      id: 'compile.linebreak.fit',
      label: 'Advanced line fit',
      stage: 'compile',
      severity: 'error',
      pass: outputs.advancedBreak.lines.every((line) => line.ratio <= 1),
      expected: 'all line ratios <= 1',
      actual: `max ratio ${Math.max(...outputs.advancedBreak.lines.map((line) => line.ratio), 0)}`,
      delta:
        Math.max(...outputs.advancedBreak.lines.map((line) => line.ratio), 0) > 1
          ? parseFloat(
              (
                Math.max(...outputs.advancedBreak.lines.map((line) => line.ratio), 0) - 1
              ).toFixed(3)
            )
          : undefined,
      details: 'The advanced typesetter should keep every rendered line within the compiled measure.'
    }),
    createDiagnostic({
      id: 'compile.target.touch-occlusion',
      label: 'Touch occlusion',
      stage: 'compile',
      severity: 'warning',
      pass: outputs.targetProof.occlusionPenaltyMs <= 120,
      expected: '<= 120ms',
      actual: `${outputs.targetProof.occlusionPenaltyMs}ms`,
      delta: parseFloat((outputs.targetProof.occlusionPenaltyMs - 120).toFixed(1)),
      unit: 'ms',
      details: 'The touch target model should keep occlusion costs within a reasonable budget.'
    }),
    createDiagnostic({
      id: 'compile.seed.normalized',
      label: 'Normalized seed',
      stage: 'compile',
      severity: 'warning',
      pass: normalized.baseColorInput.toLowerCase() === normalized.baseColor.toLowerCase(),
      expected: normalized.baseColor,
      actual: normalized.baseColorInput,
      details: 'If the input seed is invalid, the compiler falls back to a safe default and reports it explicitly.'
    })
  ];
}

export function compilePerfectProof(spec: PerfectSpec): PerfectCompileResult {
  const { normalized, diagnostics: inputDiagnostics } = normalizeSpec(spec);
  const optimizedPalette = optimizePalette(normalized.baseColor, {
    engine: 'advanced',
    goal: 'ui',
    gamut: 'srgb',
    space: 'oklch',
    cvdModel: 'machado',
    optimize: true
  });
  const tonal = optimizedPalette.tonal;
  const neutral = optimizedPalette.neutral;
  const semantic = ((normalized.mode === 'light' ? optimizedPalette.light : optimizedPalette.dark) ??
    optimizedPalette.light ??
    optimizedPalette.dark) as NonNullable<typeof optimizedPalette.light>;
  const harmony = generateHarmony(optimizedPalette.seedHex, 'split-complementary');
  const fluid = generateFluidScale({
    baseMin: 15,
    baseMax: 20,
    ratio: normalized.ratioName,
    steps: 5,
    down: 1,
    prefix: 'proof',
    naming: 'natural',
    vwMin: 360,
    vwMax: 1440
  });
  const motion = generateSpring(SPRING_PRESETS[normalized.motionPreset], 32);
  const motionCurve = motion.linear.replace(/\s+/g, ' ');
  const circleCorrections = getCorrections('circle', 72);
  const iconCorrections = getCorrections('icon', 72);
  const iconTransform = joinTransforms(iconCorrections.corrections);
  const correctedCircleSize = correctionValue(circleCorrections.corrections, 'width', '80px');
  const surfaceHex = hexOf(semantic.surface);
  const surfaceInk = hexOf(semantic['on-surface']);
  const primaryHex = hexOf(semantic.primary);
  const onPrimaryHex = hexOf(semantic['on-primary']);
  const outlineHex = hexOf(semantic.outline);
  const glassCss = generateGlassCss({
    selector: '.perfect-glass',
    blur: 22,
    opacity: normalized.mode === 'light' ? 0.48 : 0.24,
    tint: surfaceHex,
    mode: normalized.mode,
    layers: 2,
    borderOpacity: normalized.mode === 'light' ? 0.62 : 0.24,
    saturation: 145,
    noise: 0.012,
    radius: 30
  });

  const swatches = STOPS.map((stop) => {
    const color = tonal[stop];
    const onColor = autoContrastAPCA(color.hex);
    return {
      stop,
      color,
      onColor,
      lc: apcaContrast(onColor, color.hex).abs
    };
  });

  const proofCards = [
    buildProof('Body on surface', hexOf(semantic['on-surface']), hexOf(semantic.surface), 18, 400),
    buildProof('Primary action', hexOf(semantic['on-primary']), hexOf(semantic.primary), 16, 700),
    buildProof(
      'Signal accent',
      autoContrastAPCA(harmony.colors[1].tonal[500].hex),
      harmony.colors[1].tonal[500].hex,
      16,
      700
    )
  ];

  const maxScalePx = Math.max(...fluid.scale.map((step) => step.pxMax));
  const proofMeasure = Math.round(pxStep(fluid.scale, '2xl', 110) * 6.8);
  const layoutGap = Math.round(pxStep(fluid.scale, 'xs', 24) * 0.9);
  const layoutPadding = Math.round(pxStep(fluid.scale, 'sm', 32) * 0.85);
  const proofLayoutPlan: LayoutItem[] = [
    {
      id: 'signal',
      min: Math.round(pxStep(fluid.scale, 'md', 52) * 1.9),
      preferred: Math.round(pxStep(fluid.scale, 'lg', 72) * 2.1),
      max: Math.round(pxStep(fluid.scale, 'xl', 90) * 2.4),
      grow: 1.1,
      shrink: 1
    },
    {
      id: 'body',
      min: Math.round(pxStep(fluid.scale, 'xl', 90) * 2.45),
      preferred: Math.round(pxStep(fluid.scale, '2xl', 110) * 2.75),
      max: Math.round(pxStep(fluid.scale, '2xl', 110) * 3.15),
      grow: 1.8,
      shrink: 1.8
    },
    {
      id: 'assist',
      min: Math.round(pxStep(fluid.scale, 'md', 52) * 2),
      preferred: Math.round(pxStep(fluid.scale, 'lg', 72) * 2.15),
      max: Math.round(pxStep(fluid.scale, 'xl', 90) * 2.05),
      grow: 0.8,
      shrink: 0.9
    }
  ];
  const layoutProof = solveStackLayout(proofLayoutPlan, {
    container: proofMeasure,
    gap: layoutGap,
    padding: layoutPadding,
    align: 'start'
  });
  const layoutRects = [
    {
      id: 'signal',
      x: layoutProof.items[0]?.start ?? 28,
      y: 26,
      width: layoutProof.items[0]?.size ?? 170,
      height: 82
    },
    {
      id: 'body',
      x: layoutProof.items[1]?.start ?? 224,
      y: 118,
      width: layoutProof.items[1]?.size ?? 320,
      height: 142
    },
    {
      id: 'assist',
      x: layoutProof.items[2]?.start ?? 520,
      y: 58,
      width: layoutProof.items[2]?.size ?? 160,
      height: 104
    }
  ];

  const basicComposition = scoreComposition(layoutRects, {
    width: proofMeasure,
    height: 300
  });
  const proofDocument: DesignDocument = {
    frame: { width: proofMeasure, height: 300, padding: layoutPadding, gap: layoutGap, columns: 12 },
    background: {
      dominantColor: surfaceHex,
      subjectRegion: {
        x: Math.round(proofMeasure * 0.64),
        y: 34,
        width: Math.round(proofMeasure * 0.22),
        height: 144
      },
      safeRegions: [{ x: 0, y: 212, width: proofMeasure, height: 74 }]
    },
    elements: [
      {
        ...layoutRects[0],
        kind: 'group',
        role: 'cta',
        background: primaryHex,
        color: onPrimaryHex,
        importance: 0.88
      },
      { ...layoutRects[1], kind: 'text', role: 'title', color: surfaceInk, importance: 0.97 },
      { ...layoutRects[2], kind: 'text', role: 'support', color: harmony.colors[1].hex, importance: 0.58 }
    ]
  };
  const proofImportance = analyzeImportance(proofDocument, 'heuristic');
  const advancedLayout = solveDesignLayout(proofDocument, { importanceReport: proofImportance });
  const composition = scoreDesignComposition(
    {
      ...proofDocument,
      elements: advancedLayout.elements
    },
    proofImportance
  );
  const distinctness = analyzeDistinctness(
    [primaryHex, harmony.colors[1].hex, harmony.colors[2].hex, tonal[300].hex],
    10
  );
  const targetProof = analyzeTargetAcquisition({
    distance: Math.round((layoutProof.items[1]?.start ?? 220) + pxStep(fluid.scale, 'xl', 90) * 0.8),
    width: Math.round(pxStep(fluid.scale, 'sm', 32) * 1.5),
    choices: harmony.colors.length + 6,
    pathLength: Math.round(pxStep(fluid.scale, '2xl', 110) * 1.8),
    pathWidth: Math.round(pxStep(fluid.scale, 'sm', 32) * 0.92),
    modality: 'touch'
  });
  const typography = recommendTypography({
    fontSize: Math.round(pxStep(fluid.scale, 'sm', 32) * 0.56),
    containerWidth: Math.round(pxStep(fluid.scale, '2xl', 110) * 5.1),
    contrastLc: proofCards[0].lc,
    profile: proofCards[0].lc < 70 ? 'low-vision' : 'default'
  });
  const linebreakText =
    'A proof solver should resolve layout, distinction, movement, and reading comfort together.';
  const balancedBreak = balanceLines(linebreakText, 24, 4);
  const greedyBreakResult = greedyBreak(linebreakText, 24);
  const advancedBreak = typesetParagraph({
    text: linebreakText,
    widthPx: Math.round(pxStep(fluid.scale, '2xl', 110) * 4.35),
    fontSize: Math.round(pxStep(fluid.scale, 'sm', 32) * 0.68),
    language: 'en',
    hyphenate: true,
    opticalSizing: true,
    targetLines: 4,
    engine: 'advanced'
  });
  const advancedFlow = flowLinesByWidth(
    {
      text: linebreakText,
      fontSize: Math.round(pxStep(fluid.scale, 'sm', 32) * 0.68),
      lineHeight: 1.08,
      language: 'en',
      hyphenate: true,
      opticalSizing: true,
      engine: 'advanced'
    },
    [
      { label: 'lead', widthPx: Math.round(pxStep(fluid.scale, 'lg', 72) * 1.7), maxLines: 2 },
      { label: 'body', widthPx: Math.round(pxStep(fluid.scale, '2xl', 110) * 4.35) }
    ]
  );
  const jerkProof = generateMinimumJerk(Math.max(0.34, motion.duration), 24);
  const jerkPoints = jerkProof.samples.map((sample) => `${sample.t * 320},${150 - sample.x * 112}`).join(' ');

  const outputs: PerfectOutputs = {
    optimizedPalette,
    tonal,
    neutral,
    semantic,
    harmony,
    fluid,
    motion,
    motionCurve,
    circleCorrections,
    iconCorrections,
    iconTransform,
    correctedCircleSize,
    glassCss,
    swatches,
    proofCards,
    maxScalePx,
    surfaceHex,
    surfaceInk,
    primaryHex,
    onPrimaryHex,
    outlineHex,
    proofMeasure,
    layoutGap,
    layoutPadding,
    proofLayoutPlan,
    layoutProof,
    layoutRects,
    basicComposition,
    proofDocument,
    proofImportance,
    advancedLayout,
    composition,
    distinctness,
    targetProof,
    typography,
    linebreakText,
    balancedBreak,
    greedyBreakResult,
    advancedBreak,
    advancedFlow,
    jerkProof,
    jerkPoints
  };

  return {
    spec: normalized,
    outputs,
    report: buildCompileReport(buildCompileDiagnostics(normalized, outputs, inputDiagnostics))
  };
}

export function verifyPerfectProof(
  result: PerfectCompileResult,
  measurements: PerfectRenderMeasurements
): PerfectVerificationReport {
  const { controlFit, layoutFit } = measurements;
  if (!controlFit || !layoutFit) {
    return {
      ready: false,
      ok: false,
      score: null,
      diagnostics: [],
      failures: [],
      metrics: {
        controlScore: null,
        layoutScore: null,
        score: null,
        overflowCount: 0,
        mismatchCount: 0,
        missingCount: 0
      }
    };
  }

  const diagnostics: PerfectDiagnostic[] = [];

  for (const item of controlFit.items) {
    diagnostics.push(
      createDiagnostic({
        id: `render.control.${item.id}`,
        label: `Containment ${item.id}`,
        stage: 'render',
        severity: 'error',
        pass: item.contained,
        expected: 'overflow x/y = 0px',
        actual: `overflow x ${item.overflowX}px, y ${item.overflowY}px`,
        delta: Math.max(item.overflowX, item.overflowY),
        unit: 'px',
        details: item.contained
          ? 'Rendered control stays inside the compiled content box.'
          : 'Rendered control escaped its compiled content box.'
      })
    );
  }

  for (const item of layoutFit.items) {
    diagnostics.push(
      createDiagnostic({
        id: `render.layout.${item.id}`,
        label: `Layout drift ${item.id}`,
        stage: 'render',
        severity: 'error',
        pass: item.withinTolerance,
        expected: 'Δx/y <= 1.5px and Δw/h <= 1.5px',
        actual: `Δx ${item.deltaX}px, Δy ${item.deltaY}px, Δw ${item.deltaWidth}px, Δh ${item.deltaHeight}px`,
        delta: item.drift,
        unit: 'px',
        details: item.withinTolerance
          ? 'Rendered node matches the compiled layout within tolerance.'
          : 'Rendered node drifted beyond the compiled layout tolerance.'
      })
    );
  }

  for (const missing of layoutFit.metrics.missing) {
    diagnostics.push(
      createDiagnostic({
        id: `render.layout.missing.${missing}`,
        label: `Missing node ${missing}`,
        stage: 'render',
        severity: 'error',
        pass: false,
        expected: 'rendered node present',
        actual: 'missing',
        details: 'A compiled layout node did not appear in the rendered DOM.'
      })
    );
  }

  diagnostics.push(
    createDiagnostic({
      id: 'render.score',
      label: 'Render verifier score',
      stage: 'render',
      severity: 'warning',
      pass: controlFit.metrics.overflowCount === 0 && layoutFit.metrics.mismatchCount === 0 && layoutFit.metrics.missing.length === 0,
      expected: '100',
      actual: `${Math.round((controlFit.metrics.score + layoutFit.metrics.score) / 2)}`,
      delta: Math.round((controlFit.metrics.score + layoutFit.metrics.score) / 2) - 100,
      details: `Verification ran against the compiled proof for ${result.spec.baseColor}, ${result.spec.ratioName}, and ${result.spec.motionPreset}.`
    })
  );

  const failures = diagnostics.filter((diagnostic) => !diagnostic.pass && diagnostic.severity === 'error');
  const score = Math.round((controlFit.metrics.score + layoutFit.metrics.score) / 2);

  return {
    ready: true,
    ok: failures.length === 0,
    score,
    diagnostics,
    failures,
    metrics: {
      controlScore: controlFit.metrics.score,
      layoutScore: layoutFit.metrics.score,
      score,
      overflowCount: controlFit.metrics.overflowCount,
      mismatchCount: layoutFit.metrics.mismatchCount,
      missingCount: layoutFit.metrics.missing.length
    }
  };
}
