// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { portal } from './portal.js';

describe('portal', () => {
  it('moves a node into the host and removes it on destroy', () => {
    const parent = document.createElement('div');
    const host = document.createElement('div');
    const node = document.createElement('div');

    parent.appendChild(node);
    document.body.append(parent, host);

    const action = portal(node, host);
    expect(host.contains(node)).toBe(true);

    action.destroy();
    expect(parent.contains(node)).toBe(false);
    expect(host.contains(node)).toBe(false);

    parent.remove();
    host.remove();
  });
});
