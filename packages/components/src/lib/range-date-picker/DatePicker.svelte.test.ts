import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RangeDatePicker from './RangeDatePicker.svelte';

describe('RangeDatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects a start and end date and emits the completed range', async () => {
    const onChange = vi.fn();
    const { container } = render(RangeDatePicker, {
      props: {
        label: 'Delivery window',
        name: 'window',
        onChange
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /select a date range/i }));
    await fireEvent.click(screen.getByRole('button', { name: /Apr 9, 2026/i }));
    await fireEvent.click(screen.getByRole('button', { name: /Apr 12, 2026/i }));

    const start = container.querySelector('input[name="window\\[start\\]"]') as HTMLInputElement;
    const end = container.querySelector('input[name="window\\[end\\]"]') as HTMLInputElement;

    expect(start.value).toBe('2026-04-09');
    expect(end.value).toBe('2026-04-12');
    expect(onChange).toHaveBeenLastCalledWith({
      value: { start: '2026-04-09', end: '2026-04-12' }
    });
  });

  it('blocks disabled dates and keeps the dialog open until the range is complete', async () => {
    render(RangeDatePicker, {
      props: {
        label: 'Freeze window',
        min: '2026-04-10',
        max: '2026-04-20',
        disabledDates: ['2026-04-16']
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /select a date range/i }));
    const dialog = screen.getByRole('dialog', { name: /choose date range/i });

    expect((within(dialog).getByRole('button', { name: /Apr 9, 2026/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(dialog).getByRole('button', { name: /Apr 16, 2026/i }) as HTMLButtonElement).disabled).toBe(true);

    await fireEvent.click(within(dialog).getByRole('button', { name: /Apr 12, 2026/i }));
    expect(screen.getByRole('dialog', { name: /choose date range/i })).toBeTruthy();
  });

  it('supports keyboard dismissal without changing the range', async () => {
    render(RangeDatePicker, {
      props: {
        label: 'Launch window',
        value: { start: '2026-04-15', end: '2026-04-18' },
        open: true
      }
    });

    const dialog = screen.getByRole('dialog', { name: /choose date range/i });
    const selectedDay = within(dialog).getByRole('button', { name: /Apr 18, 2026/i });
    await fireEvent.keyDown(selectedDay, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /choose date range/i })).toBeNull();
  });

  it('normalizes a reverse-order range selection and closes on completion', async () => {
    const onChange = vi.fn();
    render(RangeDatePicker, {
      props: {
        label: 'Travel window',
        onChange
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /select a date range/i }));
    await fireEvent.click(screen.getByRole('button', { name: /Apr 20, 2026/i }));
    expect(screen.getByRole('dialog', { name: /choose date range/i })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: /Apr 17, 2026/i }));

    expect(onChange).toHaveBeenLastCalledWith({
      value: { start: '2026-04-17', end: '2026-04-20' }
    });
    expect(screen.queryByRole('dialog', { name: /choose date range/i })).toBeNull();
    expect(screen.getByRole('button', { name: /Apr 17, 2026 – Apr 20, 2026/i })).toBeTruthy();
  });

  it('closes on outside click and restores focus to the trigger', async () => {
    render(RangeDatePicker, {
      props: {
        label: 'Launch window',
        value: { start: '2026-04-15', end: '2026-04-18' }
      }
    });

    const trigger = screen.getByRole('button', { name: /Apr 15, 2026 – Apr 18, 2026/i });
    await fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: /choose date range/i })).toBeTruthy();

    await fireEvent.click(document.body);
    await tick();

    expect(screen.queryByRole('dialog', { name: /choose date range/i })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('moves focus across months with page navigation keys', async () => {
    render(RangeDatePicker, {
      props: {
        label: 'Launch window',
        value: { start: '2026-04-15', end: '2026-04-18' },
        open: true
      }
    });

    const dialog = screen.getByRole('dialog', { name: /choose date range/i });
    const currentDay = within(dialog).getByRole('button', { name: /Apr 18, 2026/i });

    await fireEvent.keyDown(currentDay, { key: 'PageDown' });
    await tick();

    const nextMonthDay = within(screen.getByRole('dialog', { name: /choose date range/i })).getByRole('button', {
      name: /May 18, 2026/i
    });
    expect(document.activeElement).toBe(nextMonthDay);
  });
});
