import { analyzeImportance } from './saliency.ts';
import { analyzeTargetAcquisition } from './interaction.ts';
import { scoreComposition, scoreDesignComposition } from './compose.ts';
import { solveDesignLayout, solveStackLayout, type LayoutItem } from './layout.ts';
import type { DesignDocument } from './design.ts';
import { type ColorResult } from './color.ts';
import { generateSpring } from './ease.ts';
import type { ContainmentReport, PlanFitReport } from './fit.ts';
import { generateMinimumJerk } from './jerk.ts';
import { balanceLines, flowLinesByWidth, greedyBreak } from './linebreak.ts';
import { getCorrections } from './optical.ts';
import { generateHarmony, optimizePalette } from './palette.ts';
import { analyzeDistinctness } from './perception.ts';
import { generateFluidScale } from './scale.ts';
import { recommendTypography } from './typography.ts';
import { typesetParagraph } from './typeset.ts';
import type { EngineMode } from './types.ts';
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
    layoutRects: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
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
/** Compiles mathematical design checks and reports failures. */
export declare function compilePerfectProof(spec: PerfectSpec, options?: {
    engine?: EngineMode;
}): PerfectCompileResult;
/** Compares supplied render measurements with compiled layout expectations. */
export declare function verifyPerfectProof(result: PerfectCompileResult, measurements: PerfectRenderMeasurements): PerfectVerificationReport;
