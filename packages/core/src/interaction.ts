// Interaction — Human-performance models for targeting, choice, steering, and touch occlusion.

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

export function fittsIndexOfDifficulty(distance: number, width: number): number {
  return parseFloat(Math.log2(distance / Math.max(width, 1e-6) + 1).toFixed(3));
}

export function predictFittsTime(input: FittsInput): number {
  const intercept = input.intercept ?? 50;
  const slope = input.slope ?? 150;
  return parseFloat((intercept + slope * fittsIndexOfDifficulty(input.distance, input.width)).toFixed(1));
}

export function predictHickTime(input: HickInput): number {
  const intercept = input.intercept ?? 80;
  const slope = input.slope ?? 120;
  return parseFloat((intercept + slope * Math.log2(Math.max(input.choices, 1) + 1)).toFixed(1));
}

export function predictSteeringTime(input: SteeringInput): number {
  const intercept = input.intercept ?? 0;
  const slope = input.slope ?? 110;
  return parseFloat((intercept + slope * (input.length / Math.max(input.width, 1e-6))).toFixed(1));
}

export function analyzeTargetAcquisition(options: {
  distance: number;
  width: number;
  choices: number;
  pathLength?: number;
  pathWidth?: number;
  modality?: TargetModality;
}): TargetReport {
  const modality = options.modality ?? 'mouse';
  const effectiveWidth =
    modality === 'touch'
      ? Math.max(12, options.width - Math.min(options.width * 0.32, 14))
      : options.width;
  const movementMs = predictFittsTime({ distance: options.distance, width: effectiveWidth });
  const choiceMs = predictHickTime({ choices: options.choices });
  const steeringMs =
    options.pathLength !== undefined && options.pathWidth !== undefined
      ? predictSteeringTime({
          length: options.pathLength,
          width:
            modality === 'touch'
              ? Math.max(10, options.pathWidth - Math.min(options.pathWidth * 0.25, 10))
              : options.pathWidth
        })
      : 0;
  const occlusionPenaltyMs =
    modality === 'touch'
      ? parseFloat((Math.max(0, 34 - options.width) * 2.1 + Math.max(0, options.choices - 6) * 4.5).toFixed(1))
      : 0;

  return {
    modality,
    movementMs,
    choiceMs,
    steeringMs,
    occlusionPenaltyMs,
    totalMs: parseFloat((movementMs + choiceMs + steeringMs + occlusionPenaltyMs).toFixed(1)),
    difficultyBits: fittsIndexOfDifficulty(options.distance, effectiveWidth),
    effectiveWidth: parseFloat(effectiveWidth.toFixed(1))
  };
}
