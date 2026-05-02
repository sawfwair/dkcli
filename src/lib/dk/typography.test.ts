import { describe, expect, it } from 'vitest';

import { recommendTypography } from './typography';

describe('typography', () => {
  it('recommends more generous spacing for low-vision, low-contrast text', () => {
    const standard = recommendTypography({ fontSize: 16, containerWidth: 640, contrastLc: 75 });
    const accessible = recommendTypography({
      fontSize: 16,
      containerWidth: 640,
      contrastLc: 45,
      profile: 'low-vision'
    });

    expect(accessible.lineHeight).toBeGreaterThan(standard.lineHeight);
    expect(accessible.wordSpacingEm).toBeGreaterThan(standard.wordSpacingEm);
    expect(accessible.crowdingRisk).not.toBe('low');
  });
});
