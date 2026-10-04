import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Select from './Select.svelte';

afterEach(() => document.querySelectorAll('[data-test-outside]').forEach((element) => element.remove()));

describe('Select', () => {
  const items = [
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ];

  it.each(['Enter', ' ', 'ArrowDown'])('ignores unrelated %s keys', async (key) => {
    render(Select, { props: { label: 'Environment', items } });
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    await fireEvent(window, event);

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('moves one enabled option per key and commits exactly once', async () => {
    const onChange = vi.fn();
    render(Select, { props: { label: 'Environment', onChange, items: [
      { value: 'one', label: 'One' },
      { value: 'disabled', label: 'Disabled', disabled: true },
      { value: 'two', label: 'Two' },
      { value: 'three', label: 'Three' }
    ] } });
    const trigger = screen.getByRole('button');
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'One' }));
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('option', { name: 'Two' }));
    await fireEvent.keyDown(document.activeElement!, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'two' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('does not open or emit while disabled', async () => {
    const onChange = vi.fn();
    render(Select, { props: { label: 'Environment', items, disabled: true, onChange } });
    await fireEvent.click(screen.getByRole('button'));
    await fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not choose disabled options', async () => {
    const onChange = vi.fn();
    render(Select, { props: { label: 'Environment', onChange, items: [
      { value: 'one', label: 'One' },
      { value: 'disabled', label: 'Disabled', disabled: true }
    ] } });
    await fireEvent.click(screen.getByRole('button'));
    await fireEvent.click(screen.getByRole('option', { name: 'Disabled' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('closes an open list when disabled and excludes its value from form submission', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(Select, { props: { label: 'Environment', name: 'environment', items, value: 'staging', onChange } });
    await fireEvent.click(screen.getByRole('button'));
    await rerender({ disabled: true });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each(['click', 'focus'])('closes on outside %s without stealing focus', async (method) => {
    render(Select, { props: { label: 'Environment', items } });
    await fireEvent.click(screen.getByRole('button'));
    const outside = document.createElement('button');
    outside.dataset.testOutside = 'true';
    document.body.append(outside);
    outside.focus();
    if (method === 'click') await fireEvent.click(outside);
    else await fireEvent.focusIn(outside);

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('gives separate instances unique IDs and labels their own triggers', () => {
    render(Select, { props: { label: 'First environment', items } });
    render(Select, { props: { label: 'Second environment', items } });
    const triggers = screen.getAllByRole('button');

    expect(triggers[0].id).toBeTruthy();
    expect(triggers[1].id).toBeTruthy();
    expect(triggers[0].id).not.toBe(triggers[1].id);
    expect(screen.getByLabelText('First environment')).toBe(triggers[0]);
    expect(screen.getByLabelText('Second environment')).toBe(triggers[1]);
  });

  it('preserves a supplied ID on the trigger and related listbox', async () => {
    render(Select, { props: { id: 'custom-environment', label: 'Environment', items } });
    const trigger = screen.getByRole('button');
    await fireEvent.click(trigger);

    expect(trigger.id).toBe('custom-environment');
    expect(trigger.getAttribute('aria-controls')).toBe('custom-environment-listbox');
    expect(screen.getByRole('listbox').id).toBe('custom-environment-listbox');
  });

  it('returns focus to the trigger after selecting an option', async () => {
    render(Select, {
      props: {
        label: 'Environment',
        items
      }
    });

    const trigger = screen.getByRole('button', { name: 'Environment' });
    await fireEvent.click(trigger);
    await fireEvent.click(screen.getByRole('option', { name: 'Production' }));

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on escape and restores focus to the trigger', async () => {
    render(Select, {
      props: {
        label: 'Environment',
        items
      }
    });

    const trigger = screen.getByRole('button', { name: 'Environment' });
    await fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeTruthy();

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
