import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import TooltipHarness from './TooltipHarness.svelte';

describe('Tooltip', () => {
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
