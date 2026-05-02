// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { isEventOutside, shouldDismissLayer } from './dismissable-layer.js';

describe('dismissable-layer', () => {
  it('detects outside pointer presses', () => {
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const inside = document.createElement('span');
    const outside = document.createElement('span');

    root.appendChild(inside);
    document.body.append(root, trigger, outside);

    expect(isEventOutside(root, inside)).toBe(false);
    expect(
      shouldDismissLayer({
        event: new MouseEvent('click', { bubbles: true }),
        root,
        trigger
      })
    ).toBe(true);

    root.remove();
    trigger.remove();
    outside.remove();
  });

  it('dismisses on escape when enabled', () => {
    expect(
      shouldDismissLayer({
        event: new KeyboardEvent('keydown', { key: 'Escape' }),
        root: document.createElement('div')
      })
    ).toBe(true);
    expect(
      shouldDismissLayer({
        event: new KeyboardEvent('keydown', { key: 'Escape' }),
        root: document.createElement('div'),
        closeOnEscape: false
      })
    ).toBe(false);
  });
});
