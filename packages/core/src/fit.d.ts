export type FitRect = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
};
export type FitFrame = {
    width: number;
    height: number;
};
export type ContainmentOptions = {
    overflowTolerance?: number;
};
export type ContainmentItem = FitRect & {
    overflowLeft: number;
    overflowRight: number;
    overflowTop: number;
    overflowBottom: number;
    overflowX: number;
    overflowY: number;
    contained: boolean;
};
export type ContainmentMetrics = {
    itemCount: number;
    overflowCount: number;
    maxOverflowX: number;
    maxOverflowY: number;
    totalOverflow: number;
    score: number;
};
export type ContainmentReport = {
    frame: FitFrame;
    items: ContainmentItem[];
    metrics: ContainmentMetrics;
};
export type PlanFitOptions = {
    positionTolerance?: number;
    sizeTolerance?: number;
};
export type PlanFitItem = {
    id: string;
    expected: FitRect;
    actual: FitRect;
    deltaX: number;
    deltaY: number;
    deltaWidth: number;
    deltaHeight: number;
    drift: number;
    withinTolerance: boolean;
};
export type PlanFitMetrics = {
    matched: number;
    missing: string[];
    mismatchCount: number;
    meanDrift: number;
    maxDrift: number;
    score: number;
};
export type PlanFitReport = {
    items: PlanFitItem[];
    metrics: PlanFitMetrics;
};
export type MetricGridOptions = {
    gap?: number;
    minCellWidth?: number;
    compactThreshold?: number;
    maxColumns?: number;
};
export type MetricGridRecommendation = {
    columns: number;
    cellWidth: number;
    compact: boolean;
};
export declare function verifyContainment(frame: FitFrame, items: FitRect[], options?: ContainmentOptions): ContainmentReport;
export declare function verifyPlanFit(expected: FitRect[], actual: FitRect[], options?: PlanFitOptions): PlanFitReport;
export declare function recommendMetricGrid(containerWidth: number, itemCount: number, options?: MetricGridOptions): MetricGridRecommendation;
