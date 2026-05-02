import type { TargetModality } from './types.ts';
export type FittsInput = {
    distance: number;
    width: number;
    intercept?: number;
    slope?: number;
};
export type HickInput = {
    choices: number;
    intercept?: number;
    slope?: number;
};
export type SteeringInput = {
    length: number;
    width: number;
    intercept?: number;
    slope?: number;
};
export type TargetReport = {
    modality: TargetModality;
    movementMs: number;
    choiceMs: number;
    steeringMs: number;
    occlusionPenaltyMs: number;
    totalMs: number;
    difficultyBits: number;
    effectiveWidth: number;
};
export declare function fittsIndexOfDifficulty(distance: number, width: number): number;
export declare function predictFittsTime(input: FittsInput): number;
export declare function predictHickTime(input: HickInput): number;
export declare function predictSteeringTime(input: SteeringInput): number;
export declare function analyzeTargetAcquisition(options: {
    distance: number;
    width: number;
    choices: number;
    pathLength?: number;
    pathWidth?: number;
    modality?: TargetModality;
}): TargetReport;
