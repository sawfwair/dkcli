import { describe, expect, it } from 'vitest';

import { generateMinimumJerk, minimumJerkPosition } from './jerk';

describe('jerk', () => {
  it('produces a smooth minimum-jerk curve from 0 to 1', () => {
    expect(minimumJerkPosition(0)).toBe(0);
    expect(minimumJerkPosition(1)).toBe(1);

    const result = generateMinimumJerk(0.5, 10);
    expect(result.samples[0]?.x).toBe(0);
    expect(result.samples.at(-1)?.x).toBe(1);
    expect(result.linear).toMatch(/^linear\(/);
  });
});
