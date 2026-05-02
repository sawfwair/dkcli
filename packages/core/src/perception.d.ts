import type { ColorSpace, CvdModel, Gamut } from './types.ts';
export type LabColor = {
    l: number;
    a: number;
    b: number;
};
export type CvdType = 'protan' | 'deutan' | 'tritan';
export type DistinctPair = {
    left: string;
    right: string;
    deltaE: number;
};
export type DistinctnessReport = {
    minDeltaE: number;
    collisions: DistinctPair[];
    cvd: Record<CvdType, {
        minDeltaE: number;
        collisions: DistinctPair[];
    }>;
    space: ColorSpace;
    gamut: Gamut;
};
export declare function hexToLab(hex: string): LabColor;
export declare function deltaE00Lab(left: LabColor, right: LabColor): number;
export declare function deltaE00(leftHex: string, rightHex: string): number;
export declare function deltaEColorSpace(leftHex: string, rightHex: string, space?: ColorSpace): number;
export declare function simulateCvd(hex: string, type: CvdType, severity?: number, model?: CvdModel): string;
export declare function analyzeDistinctness(colors: string[], threshold?: number, options?: {
    space?: ColorSpace;
    gamut?: Gamut;
    cvdModel?: CvdModel;
    severity?: number;
}): DistinctnessReport;
