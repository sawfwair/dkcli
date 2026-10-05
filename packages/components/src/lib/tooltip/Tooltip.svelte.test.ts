import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TooltipHarness from './TooltipHarness.svelte';

afterEach(() => vi.useRealTimers());

describe('Tooltip', () => {
  it('stays open when the pointer moves between descendants of its trigger', async () => {
    vi.useFakeTimers();
    const { container } = render(TooltipHarness);
    const trigger = container.querySelector('.tooltip-trigger')!;
    const button = screen.getByRole('button', { name: 'Hover me' });
    await fireEvent.mouseOver(trigger);
    await vi.advanceTimersByTimeAsync(320);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    await fireEvent.mouseOut(button, { relatedTarget: trigger });
    expect(screen.getByRole('tooltip')).toBeTruthy();
  });

  it('cancels a pending opening when disabled', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const { container, rerender } = render(TooltipHarness, { props: { onOpenChange } });
    await fireEvent.mouseOver(container.querySelector('.tooltip-trigger')!);
    await vi.advanceTimersByTimeAsync(100);
    await rerender({ disabled: true });
    await vi.advanceTimersByTimeAsync(300);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('cancels a pending opening when unmounted', async () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const { container, unmount } = render(TooltipHarness, { props: { onOpenChange } });
    await fireEvent.mouseOver(container.querySelector('.tooltip-trigger')!);
    unmount();
    await vi.advanceTimersByTimeAsync(320);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('links a tooltip opened by its controlled prop to the actual trigger', async () => {
    const { rerender } = render(TooltipHarness);
    await rerender({ open: true });
    const tooltip = screen.getByRole('tooltip');
    const button = screen.getByRole('button', { name: 'Hover me' });
    expect(button.getAttribute('aria-describedby')).toBe(tooltip.id);
    await rerender({ open: false });
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });

  it('opens on hover, links aria-describedby, and clears it on mouseout', async () => {
    vi.useFakeTimers();
    const { container } = render(TooltipHarness, {
      props: {
        content: 'Helpful copy'
      }
    });

    const trigger = container.querySelector('.tooltip-trigger') as HTMLElement;
    const button = screen.getByRole('button', { name: 'Hover me' });

    await fireEvent.mouseOver(trigger);
    await vi.advanceTimersByTimeAsync(320);
    const tooltip = screen.getByRole('tooltip', { name: 'Helpful copy' });

    expect(tooltip).toBeTruthy();
    expect(button.getAttribute('aria-describedby')).toBe(tooltip.getAttribute('id'));

    await fireEvent.mouseOut(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    vi.useRealTimers();
  });

  it('does not open when disabled', async () => {
    vi.useFakeTimers();
    const { container } = render(TooltipHarness, {
      props: {
        disabled: true
      }
    });

    await fireEvent.mouseOver(container.querySelector('.tooltip-trigger') as HTMLElement);
    await vi.advanceTimersByTimeAsync(320);

    expect(screen.queryByRole('tooltip')).toBeNull();
    vi.useRealTimers();
  });
});
