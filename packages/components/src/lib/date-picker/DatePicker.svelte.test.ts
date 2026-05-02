import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import DatePicker from './DatePicker.svelte';

describe('DatePicker', () => {
  it('closes on outside click and restores focus to the trigger', async () => {
    render(DatePicker, {
      props: {
        label: 'Launch date',
        value: '2026-04-15'
      }
    });

    const trigger = screen.getByRole('button', { name: /Apr 15, 2026/i });
    await fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: /Choose date/i })).toBeTruthy();

    await fireEvent.click(document.body);
    await tick();

    expect(screen.queryByRole('dialog', { name: /Choose date/i })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('updates month and focus with page navigation keys', async () => {
    render(DatePicker, {
      props: {
        label: 'Launch date',
        value: '2026-04-15'
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /Apr 15, 2026/i }));
    const dialog = screen.getByRole('dialog', { name: /Choose date/i });
    const currentDay = within(dialog).getByRole('button', { name: /Apr 15, 2026/i });

    await fireEvent.keyDown(currentDay, { key: 'PageDown' });
    await tick();

    const nextMonthDay = within(screen.getByRole('dialog', { name: /Choose date/i })).getByRole('button', {
      name: /May 15, 2026/i
    });
    expect(document.activeElement).toBe(nextMonthDay);
  });
});
