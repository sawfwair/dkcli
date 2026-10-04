import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';

import CommandPalette from './CommandPalette.svelte';
import CommandPaletteFocusHarness from './CommandPaletteFocusHarness.svelte';

describe('CommandPalette', () => {
  it('returns focus to the external opener after Escape closes a bound palette', async () => {
    render(CommandPaletteFocusHarness);

    const trigger = screen.getByRole('button', { name: 'Open commands' });
    trigger.focus();
    await fireEvent.click(trigger);
    await tick();

    const input = screen.getByRole('combobox');
    expect(document.activeElement).toBe(input);
    await fireEvent.keyDown(input, { key: 'Escape' });
    await tick();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

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
