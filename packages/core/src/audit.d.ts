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
/** Extracts supported declaration values from source CSS without resolving the cascade. */
export declare function extractCssValues(css: string): ExtractedValues;
/** Finds the named ratio and base size with the lowest scale-fitting error. */
export declare function fitScale(values: number[]): ScaleFit;
export declare function scoreColorCoherence(values: ExtractedValues): CategoryScore;
/** Scores APCA checks for color pairs extracted from individual source rules. */
export declare function scoreContrast(values: ExtractedValues): CategoryScore;
export declare function scoreSpacing(values: ExtractedValues): CategoryScore;
export declare function scoreTypography(values: ExtractedValues): CategoryScore;
export declare function scoreConsistency(values: ExtractedValues): CategoryScore;
export declare function scoreGridAlignment(values: ExtractedValues): CategoryScore;
/** Scores source CSS heuristics without resolving the cascade or rendering elements. */
export declare function audit(css: string): AuditReport;
/** Formats heuristic scores and up to 10 issues as CSS comments. */
export declare function formatAuditCss(report: AuditReport): string;
/** Serializes the audit report as JSON. */
export declare function formatAuditJson(report: AuditReport): string;
/** Scores supplied CSS and adds rule counts under the rendered mode label. Does not collect browser evidence. */
export declare function auditRenderedCss(css: string): RenderedAuditReport;
