import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import SideNav from './SideNav.svelte';

describe('SideNav', () => {
  it('supports hierarchy navigation and emits a change for the active item', async () => {
    const onChange = vi.fn();
    render(SideNav, {
      props: {
        items: [
          {
            id: 'workspace',
            label: 'Workspace',
            children: [
              { id: 'overview', label: 'Overview' },
              { id: 'releases', label: 'Releases' }
            ]
          },
          { id: 'settings', label: 'Settings' }
        ],
        activeId: 'overview',
        onChange
      }
    });

    const workspace = screen.getByRole('button', { name: 'Workspace' });
    await fireEvent.keyDown(workspace, { key: 'ArrowRight' });

    const releases = screen.getByRole('button', { name: /releases/i });
    await fireEvent.click(releases);

    expect(onChange).toHaveBeenCalledWith({ id: 'releases' });
  });
});
