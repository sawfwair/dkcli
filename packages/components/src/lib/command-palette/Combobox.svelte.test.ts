import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tick } from 'svelte';

import CommandPalette from './CommandPalette.svelte';
import CommandPaletteFocusHarness from './CommandPaletteFocusHarness.svelte';

afterEach(() => {
  document.querySelectorAll('[data-command-outside]').forEach((element) => element.remove());
  vi.restoreAllMocks();
});

describe('CommandPalette', () => {
  it('keeps a usable highlighted command after a controlled query narrows results', async () => {
    const onAction = vi.fn();
    const { rerender } = render(CommandPalette, { props: { open: true, items: [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }], onAction } });
    await tick();
    const input = screen.getByRole('combobox');
    await fireEvent.keyDown(input, { key: 'End' });
    await rerender({ query: 'One' });
    input.focus();
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAction).toHaveBeenCalledExactlyOnceWith({ id: 'one' });
  });

  it('focuses an initially open palette and traps Tab inside its modal surface', async () => {
    render(CommandPalette, { props: { open: true, items: [{ id: 'first', label: 'First' }, { id: 'last', label: 'Last' }] } });
    await tick();
    const input = screen.getByRole('combobox');
    expect(document.activeElement).toBe(input);
    await fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    const last = screen.getByRole('option', { name: 'Last' });
    expect(document.activeElement).toBe(last);
    await fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(input);
  });

  it('dismisses after an outside click without stealing its new focus', async () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    render(CommandPaletteFocusHarness);
    const opener = screen.getByRole('button', { name: 'Open commands' });
    opener.focus();
    await fireEvent.click(opener);
    await tick();
    now = 200;
    const outside = document.createElement('button');
    outside.dataset.commandOutside = 'true';
    document.body.append(outside);
    outside.focus();
    await fireEvent.click(outside);
    await tick();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('keeps Tab navigation inside an open modal palette', async () => {
    render(CommandPalette, { props: { open: true, items: [{ id: 'last', label: 'Last' }] } });
    await tick();
    const input = screen.getByRole('combobox');
    input.focus();
    await fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    const last = screen.getByRole('option', { name: 'Last' });
    expect(document.activeElement).toBe(last);
    await fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(input);
  });

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
