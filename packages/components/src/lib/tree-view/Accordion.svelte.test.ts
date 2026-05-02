import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import TreeView from './TreeView.svelte';

describe('TreeView', () => {
  it('expands branches and emits selection changes', async () => {
    const onChange = vi.fn();

    render(TreeView, {
      props: {
        items: [
          {
            id: 'workspace',
            label: 'Workspace',
            children: [
              { id: 'overview', label: 'Overview', description: 'Landing page' },
              { id: 'activity', label: 'Activity', description: 'Recent events' }
            ]
          }
        ],
        expandedIds: ['workspace'],
        onChange
      }
    });

    const activity = screen.getByRole('button', { name: /activity/i });
    await fireEvent.click(activity);

    expect(onChange).toHaveBeenCalledWith({ value: 'activity' });
  });
});
