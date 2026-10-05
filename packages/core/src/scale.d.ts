export declare const RATIOS: Record<string, number>;
export declare const NATURAL_DOWN: string[];
export declare const NATURAL_UP: string[];
export type ScaleStep = {
    step: number;
    name: string;
    token: string;
    value: string;
    px: number;
    rem: number;
};
export type ScaleMeta = {
    base: number;
    ratio: number;
    ratioName: string;
    unit: string;
    naming: string;
};
export declare function resolveRatio(val?: string): {
    name: string;
    value: number;
};
export declare function stepName(step: number, naming: string): string;
/** Generates finite tokens with integer steps/down from 0 to 10,000 and px or rem units. */
export declare function generateScale(options: {
    base?: number;
    ratio?: string;
    steps?: number;
    down?: number;
    unit?: string;
    prefix?: string;
    naming?: string;
}): {
    meta: ScaleMeta;
    scale: ScaleStep[];
};
export declare const FIBONACCI: number[];
/** Extends the Fibonacci recurrence, rejecting overflow and counts outside 0 to 10,000. */
export declare function generateFibonacciScale(options?: {
    base?: number;
    steps?: number;
    down?: number;
    unit?: string;
    prefix?: string;
    naming?: string;
}): {
    meta: ScaleMeta;
    scale: ScaleStep[];
};
export type FluidScaleStep = ScaleStep & {
    clamp: string;
    pxMin: number;
    pxMax: number;
};
export type FluidScaleMeta = ScaleMeta & {
    baseMin: number;
    baseMax: number;
    vwMin: number;
    vwMax: number;
};
/** Generates CSS clamp() values for ordered finite sizes/viewports, with 0 to 10,000 steps/down. */
export declare function generateFluidScale(options?: {
    baseMin?: number;
    baseMax?: number;
    ratio?: string;
    steps?: number;
    down?: number;
    prefix?: string;
    naming?: string;
    vwMin?: number;
    vwMax?: number;
}): {
    meta: FluidScaleMeta;
    scale: FluidScaleStep[];
};
