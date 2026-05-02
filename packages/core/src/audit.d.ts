export type ExtractedColor = {
    hex: string;
    selector: string;
};
export type ExtractedSize = {
    px: number;
    selector: string;
};
export type ExtractedSpacing = {
    px: number;
    property: string;
    selector: string;
};
export type ColorPair = {
    text: string;
    bg: string;
    selector: string;
    fontSize: number;
    fontWeight: number;
};
export type ExtractedValues = {
    textColors: ExtractedColor[];
    bgColors: ExtractedColor[];
    fontSizes: ExtractedSize[];
    fontWeights: Array<{
        weight: number;
        selector: string;
    }>;
    fontFamilies: Array<{
        family: string;
        selector: string;
    }>;
    spacings: ExtractedSpacing[];
    borderRadii: Array<{
        px: number;
        selector: string;
    }>;
    colorPairs: ColorPair[];
};
export type Issue = {
    severity: 'fail' | 'warn' | 'info';
    message: string;
};
export type CategoryScore = {
    score: number;
    label: string;
    summary: string;
    issues: Issue[];
};
export type ScaleFit = {
    ratioName: string;
    ratio: number;
    base: number;
    rmse: number;
    values: Array<{
        actual: number;
        expected: number;
        step: number;
        deviation: number;
    }>;
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
    viewport?: {
        width: number;
        height: number;
    };
    dark?: boolean;
};
export type RenderedAuditReport = AuditReport & {
    mode: 'rendered';
    ruleCount: number;
    selectorCount: number;
};
export declare function extractCssValues(css: string): ExtractedValues;
export declare function fitScale(values: number[]): ScaleFit;
export declare function scoreColorCoherence(values: ExtractedValues): CategoryScore;
export declare function scoreContrast(values: ExtractedValues): CategoryScore;
export declare function scoreSpacing(values: ExtractedValues): CategoryScore;
export declare function scoreTypography(values: ExtractedValues): CategoryScore;
export declare function scoreConsistency(values: ExtractedValues): CategoryScore;
export declare function scoreGridAlignment(values: ExtractedValues): CategoryScore;
export declare function audit(css: string): AuditReport;
export declare function formatAuditCss(report: AuditReport): string;
export declare function formatAuditJson(report: AuditReport): string;
export declare function auditRenderedCss(css: string): RenderedAuditReport;
