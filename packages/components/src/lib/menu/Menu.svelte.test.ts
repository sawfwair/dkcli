import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Menu from './Menu.svelte';
import MenuHarness from './MenuHarness.svelte';

afterEach(() => document.querySelectorAll('[data-test-outside]').forEach((element) => element.remove()));

describe('Menu', () => {
  it.each([['ArrowDown', 'First'], ['ArrowUp', 'Last']])('opens from %s and focuses %s', async (key, label) => {
    render(Menu, { props: { items: [{ value: 'first', label: 'First' }, { value: 'last', label: 'Last' }] } });
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    trigger.focus();
    await fireEvent.keyDown(trigger, { key });
    await tick();
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: label }));
  });

  it('closes when focus leaves without stealing outside focus or choosing an action', async () => {
    const onAction = vi.fn();
    render(Menu, { props: { items: [{ value: 'rename', label: 'Rename' }], onAction } });
    await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const outside = document.createElement('button');
    outside.dataset.testOutside = 'true';
    document.body.append(outside);
    outside.focus();
    await fireEvent.focusIn(outside);

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(outside);
    expect(onAction).not.toHaveBeenCalled();
  });

  it.each(['click', 'Enter', ' '])('delivers the chosen action once through callback and legacy event using %s', async (method) => {
    const onAction = vi.fn();
    const onActionEvent = vi.fn();
    render(MenuHarness, { props: { items: [{ value: 'rename', label: 'Rename' }], onAction, onActionEvent } });
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await fireEvent.click(trigger);
    const option = screen.getByRole('menuitem', { name: 'Rename' });

    if (method === 'click') await fireEvent.click(option);
    else await fireEvent.keyDown(option, { key: method });

    expect(onAction).toHaveBeenCalledExactlyOnceWith({ value: 'rename' });
    expect(onActionEvent).toHaveBeenCalledExactlyOnceWith({ value: 'rename' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('does not deliver disabled actions', async () => {
    const onAction = vi.fn();
    const onActionEvent = vi.fn();
    render(MenuHarness, { props: { items: [{ value: 'delete', label: 'Delete', disabled: true }], onAction, onActionEvent } });
    await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Delete' }), { key: 'Enter' });

    expect(onAction).not.toHaveBeenCalled();
    expect(onActionEvent).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('focuses the first enabled item on open and skips disabled items', async () => {
    render(Menu, {
      props: {
        items: [
          { value: 'archive', label: 'Archive', disabled: true },
          { value: 'rename', label: 'Rename' },
          { value: 'delete', label: 'Delete' }
        ]
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await tick();

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Rename' }));
  });

  it('closes on outside click and restores focus to the trigger', async () => {
    render(Menu, {
      props: {
        items: [
          { value: 'rename', label: 'Rename' },
          { value: 'delete', label: 'Delete' }
        ]
      }
    });

    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeTruthy();

    await fireEvent.click(document.body);
    await tick();

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
