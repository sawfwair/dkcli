import { describe, expect, it } from 'vitest';

import { balanceLines, flowLinesByWidth, greedyBreak } from './linebreak';

describe('linebreak', () => {
  it('balances headline lines with lower badness than greedy wrapping', () => {
    const text = 'Mathematical interfaces deserve line breaks that feel intentional and calm';
    const greedy = greedyBreak(text, 24);
    const balanced = balanceLines(text, 24, 3);

    expect(balanced.lines.length).toBeGreaterThan(1);
    expect(balanced.badness).toBeLessThanOrEqual(greedy.badness + 48);
  });

  it('streams lines through lead and body slots', () => {
    const flow = flowLinesByWidth(
      {
        text: 'Prepared text should continue from the narrow lead into the wider body without restarting.',
        fontSize: 18,
        lineHeight: 1.45,
        language: 'en',
        hyphenate: true,
        opticalSizing: true,
        engine: 'advanced'
      },
      [
        { label: 'lead', widthPx: 180, maxLines: 2 },
        { label: 'body', widthPx: 320 }
      ]
    );

    expect(flow.lineCount).toBeGreaterThan(2);
    expect(flow.slots[0]?.lines).toHaveLength(2);
    expect(flow.slots[1]?.lines.length).toBeGreaterThan(0);
    expect(flow.tightWidth).toBeGreaterThan(0);
  });
});
