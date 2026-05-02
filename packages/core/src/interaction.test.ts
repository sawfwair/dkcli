import { describe, expect, it } from 'vitest';

import {
  analyzeTargetAcquisition,
  fittsIndexOfDifficulty,
  predictFittsTime,
  predictHickTime,
  predictSteeringTime
} from './interaction.ts';

describe('interaction', () => {
  it('predicts more time for harder target acquisition tasks', () => {
    expect(fittsIndexOfDifficulty(400, 40)).toBeGreaterThan(fittsIndexOfDifficulty(80, 40));
    expect(predictFittsTime({ distance: 400, width: 40 })).toBeGreaterThan(
      predictFittsTime({ distance: 80, width: 40 })
    );
  });

  it('models choice and steering as additive interaction costs', () => {
    const report = analyzeTargetAcquisition({
      distance: 280,
      width: 44,
      choices: 12,
      pathLength: 180,
      pathWidth: 28
    });

    expect(predictHickTime({ choices: 12 })).toBeGreaterThan(0);
    expect(predictSteeringTime({ length: 180, width: 28 })).toBeGreaterThan(0);
    expect(report.totalMs).toBeGreaterThan(report.movementMs);
  });

  it('adds touch-specific penalties and reduces effective target width', () => {
    const mouse = analyzeTargetAcquisition({
      distance: 280,
      width: 44,
      choices: 8,
      pathLength: 180,
      pathWidth: 28,
      modality: 'mouse'
    });
    const touch = analyzeTargetAcquisition({
      distance: 280,
      width: 44,
      choices: 8,
      pathLength: 180,
      pathWidth: 28,
      modality: 'touch'
    });

    expect(touch.occlusionPenaltyMs).toBeGreaterThan(0);
    expect(touch.effectiveWidth).toBeLessThan(mouse.effectiveWidth);
    expect(touch.totalMs).toBeGreaterThan(mouse.totalMs);
  });
});
