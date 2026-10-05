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
    document.querySelectorAll('[data-test-calendar-external]').forEach((element) => element.remove());
  });

  it('excludes a disabled range from native form submission', async () => {
    const form = document.createElement('form');
    form.dataset.testCalendarExternal = 'true';
    document.body.append(form);
    const { rerender } = render(RangeDatePicker, { target: form, props: { label: 'Launch window', name: 'window', value: { start: '2026-04-15', end: '2026-04-18' } } });
    expect([...new FormData(form).entries()]).toEqual([['window[start]', '2026-04-15'], ['window[end]', '2026-04-18']]);
    await rerender({ disabled: true });

    expect([...new FormData(form).entries()]).toEqual([]);
  });

  it('closes an open calendar when disabled without changing the range', async () => {
    const onChange = vi.fn();
    const { rerender } = render(RangeDatePicker, { props: { label: 'Launch window', value: { start: '2026-04-15', end: '2026-04-18' }, onChange } });
    await fireEvent.click(screen.getByRole('button', { name: 'Launch window' }));
    await rerender({ disabled: true });
    const remainingDay = screen.queryByRole('button', { name: /Apr 16, 2026/i });
    if (remainingDay) await fireEvent.click(remainingDay);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /Choose date range/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Launch window' }).textContent).toContain('Apr 15, 2026 – Apr 18, 2026');
  });

  it('keeps focus on an outside input after its click dismisses the calendar', async () => {
    render(RangeDatePicker, { props: { label: 'Launch window', value: { start: '2026-04-15', end: '2026-04-18' } } });
    await fireEvent.click(screen.getByRole('button', { name: 'Launch window' }));
    const outside = document.createElement('input');
    outside.dataset.testCalendarExternal = 'true';
    document.body.append(outside);
    outside.focus();
    await fireEvent.click(outside);
    await tick();

    expect(screen.queryByRole('dialog', { name: /Choose date range/i })).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('moves backward across month boundaries to the current-month date with one day tab stop', async () => {
    const onChange = vi.fn();
    render(RangeDatePicker, { props: { label: 'Launch window', open: true, value: { start: '2026-04-15', end: '2026-05-01' }, onChange } });
    const april = screen.getByRole('grid', { name: 'April 2026' });
    const may = screen.getByRole('grid', { name: 'May 2026' });
    const currentDay = within(may).getByRole('button', { name: /May 1, 2026/i });
    currentDay.focus();
    await fireEvent.keyDown(currentDay, { key: 'ArrowLeft' });
    await tick();

    const aprilDay = within(april).getByRole('button', { name: /Apr 30, 2026/i });
    expect(document.activeElement).toBe(aprilDay);
    expect(screen.getByRole('dialog', { name: /Choose date range/i }).querySelectorAll('.range-day[tabindex="0"]')).toHaveLength(1);
    expect(onChange).not.toHaveBeenCalled();
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

    await fireEvent.click(screen.getByRole('button', { name: 'Delivery window' }));
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

    await fireEvent.click(screen.getByRole('button', { name: 'Freeze window' }));
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

    await fireEvent.click(screen.getByRole('button', { name: 'Travel window' }));
    await fireEvent.click(screen.getByRole('button', { name: /Apr 20, 2026/i }));
    expect(screen.getByRole('dialog', { name: /choose date range/i })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: /Apr 17, 2026/i }));

    expect(onChange).toHaveBeenLastCalledWith({
      value: { start: '2026-04-17', end: '2026-04-20' }
    });
    expect(screen.queryByRole('dialog', { name: /choose date range/i })).toBeNull();
    expect(screen.getByRole('button', { name: 'Travel window' }).textContent).toContain('Apr 17, 2026 – Apr 20, 2026');
  });

  it('closes on outside click and restores focus to the trigger', async () => {
    render(RangeDatePicker, {
      props: {
        label: 'Launch window',
        value: { start: '2026-04-15', end: '2026-04-18' }
      }
    });

    const trigger = screen.getByRole('button', { name: 'Launch window' });
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
