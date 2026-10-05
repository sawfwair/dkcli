import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import PopoverHarness from './PopoverHarness.svelte';

afterEach(() => document.querySelectorAll('[data-test-popover-outside]').forEach((element) => element.remove()));

describe('Popover', () => {
  it('keeps focus on an outside action after its click dismisses the popover', async () => {
    render(PopoverHarness);
    await fireEvent.click(screen.getByRole('button', { name: 'Open popover' }));
    const outside = document.createElement('button');
    outside.dataset.testPopoverOutside = 'true';
    outside.textContent = 'Continue';
    document.body.append(outside);
    outside.focus();
    await fireEvent.click(outside);
    await tick();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('focuses a static-content surface on open and restores the trigger after Escape', async () => {
    render(PopoverHarness, { props: { focusableContent: false } });

    const trigger = screen.getByRole('button', { name: 'Open popover' });
    trigger.focus();
    await fireEvent.click(trigger);
    await tick();

    const surface = screen.getByRole('dialog');
    expect(document.activeElement).toBe(surface);
    await fireEvent.keyDown(surface, { key: 'Escape' });
    await tick();

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

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
