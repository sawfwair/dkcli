import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import CommandPalette from './CommandPalette.svelte';

describe('CommandPalette', () => {
  it('filters items and emits an action when a command is selected', async () => {
    const onAction = vi.fn();
    const onQueryChange = vi.fn();

    render(CommandPalette, {
      props: {
        open: true,
        items: [
          { id: 'open-release', label: 'Open release', section: 'Navigation', keywords: ['release'] },
          { id: 'open-settings', label: 'Open settings', section: 'Navigation', keywords: ['settings'] }
        ],
        onAction,
        onQueryChange
      }
    });

    const input = screen.getByRole('combobox');
    await fireEvent.input(input, { target: { value: 'settings' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(onQueryChange).toHaveBeenCalledWith({ query: 'settings' });
    expect(onAction).toHaveBeenCalledWith({ id: 'open-settings' });
  });
});
