import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import PopoverHarness from './PopoverHarness.svelte';

describe('Popover', () => {
  it('focuses the first focusable element on open and restores focus after outside click', async () => {
    render(PopoverHarness);

    const trigger = screen.getByRole('button', { name: 'Open popover' });
    await fireEvent.click(trigger);
    await tick();

    const action = screen.getByRole('button', { name: 'Primary action' });
    expect(document.activeElement).toBe(action);

    await fireEvent.click(document.body);
    await tick();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('stays open when outside press dismissal is disabled', async () => {
    render(PopoverHarness, {
      props: {
        closeOnOutsidePress: false
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
    await fireEvent.click(document.body);

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
