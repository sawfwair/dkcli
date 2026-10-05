import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DatePicker from './DatePicker.svelte';

afterEach(() => document.querySelectorAll('[data-test-calendar-external]').forEach((element) => element.remove()));

describe('DatePicker', () => {
  it('excludes a disabled date value from native form submission', async () => {
    const form = document.createElement('form');
    form.dataset.testCalendarExternal = 'true';
    document.body.append(form);
    const { rerender } = render(DatePicker, { target: form, props: { label: 'Launch date', name: 'launch', value: '2026-04-15' } });
    expect([...new FormData(form).entries()]).toEqual([['launch', '2026-04-15']]);
    await rerender({ disabled: true });

    expect([...new FormData(form).entries()]).toEqual([]);
  });

  it('closes an open calendar when disabled without committing another date', async () => {
    const onChange = vi.fn();
    const { rerender } = render(DatePicker, { props: { label: 'Launch date', value: '2026-04-15', onChange } });
    await fireEvent.click(screen.getByRole('button', { name: 'Launch date' }));
    await rerender({ disabled: true });
    const remainingDay = screen.queryByRole('button', { name: /Apr 16, 2026/i });
    if (remainingDay) await fireEvent.click(remainingDay);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /Choose date/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Launch date' }).textContent).toContain('Apr 15, 2026');
  });

  it('keeps focus on an outside input after its click dismisses the calendar', async () => {
    render(DatePicker, { props: { label: 'Launch date', value: '2026-04-15' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Launch date' }));
    const outside = document.createElement('input');
    outside.dataset.testCalendarExternal = 'true';
    document.body.append(outside);
    outside.focus();
    await fireEvent.click(outside);
    await tick();

    expect(screen.queryByRole('dialog', { name: /Choose date/i })).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('returns keyboard focus to the trigger after committing the focused date', async () => {
    const onChange = vi.fn();
    render(DatePicker, { props: { label: 'Launch date', value: '2026-04-15', onChange } });
    const trigger = screen.getByRole('button', { name: 'Launch date' });
    await fireEvent.click(trigger);
    const day = screen.getByRole('button', { name: /Apr 16, 2026/i });
    day.focus();
    await fireEvent.keyDown(day, { key: 'Enter' });
    await tick();

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: '2026-04-16' });
    expect(screen.queryByRole('dialog', { name: /Choose date/i })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on outside click and restores focus to the trigger', async () => {
    render(DatePicker, {
      props: {
        label: 'Launch date',
        value: '2026-04-15'
      }
    });

    const trigger = screen.getByRole('button', { name: 'Launch date' });
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

    await fireEvent.click(screen.getByRole('button', { name: 'Launch date' }));
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
