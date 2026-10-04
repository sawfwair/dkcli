import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Combobox from './Combobox.svelte';

afterEach(() => document.querySelectorAll('[data-test-outside]').forEach((element) => element.remove()));

describe('Combobox', () => {
  const items = [
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ];

  it.each(['Enter', 'ArrowDown'])('ignores unrelated %s keys', async (key) => {
    render(Combobox, { props: { label: 'Environment', items } });
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    await fireEvent(window, event);

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps typing focus in the input and advances one enabled option per key', async () => {
    const onChange = vi.fn();
    render(Combobox, { props: { label: 'Environment', onChange, items: [
      { value: 'one', label: 'One' },
      { value: 'disabled', label: 'Disabled', disabled: true },
      { value: 'two', label: 'Two' },
      { value: 'three', label: 'Three' }
    ] } });
    const input = screen.getByRole('combobox', { name: 'Environment' });
    input.focus();
    await fireEvent.focus(input);
    expect(document.activeElement).toBe(input);
    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    const option = screen.getByRole('option', { name: 'Two' });
    expect(option.getAttribute('data-highlighted')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(option.id);
    expect(document.activeElement).toBe(input);
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'two' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('filters while preserving focus and commits the matching option', async () => {
    const onChange = vi.fn();
    render(Combobox, { props: { label: 'Environment', items, onChange } });
    const input = screen.getByRole('combobox', { name: 'Environment' });
    input.focus();
    await fireEvent.input(input, { target: { value: 'prod' } });

    expect(document.activeElement).toBe(input);
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'production' });
  });

  it('does not open or emit while disabled', async () => {
    const onChange = vi.fn();
    render(Combobox, { props: { label: 'Environment', items, disabled: true, onChange } });
    await fireEvent.focus(screen.getByRole('combobox', { name: 'Environment' }));
    await fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not choose disabled options', async () => {
    const onChange = vi.fn();
    render(Combobox, { props: { label: 'Environment', onChange, items: [
      { value: 'one', label: 'One' },
      { value: 'disabled', label: 'Disabled', disabled: true }
    ] } });
    await fireEvent.focus(screen.getByRole('combobox', { name: 'Environment' }));
    await fireEvent.click(screen.getByRole('option', { name: 'Disabled' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('closes an open list when disabled and excludes its value from form submission', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(Combobox, { props: { label: 'Environment', name: 'environment', items, value: 'staging', onChange } });
    await fireEvent.focus(screen.getByRole('combobox', { name: 'Environment' }));
    await rerender({ disabled: true });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')?.disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each(['click', 'focus'])('closes on outside %s without stealing focus', async (method) => {
    render(Combobox, { props: { label: 'Environment', items } });
    const input = screen.getByRole('combobox', { name: 'Environment' });
    input.focus();
    await fireEvent.focus(input);
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

  it('gives separate instances unique IDs and labels their own inputs', () => {
    render(Combobox, { props: { label: 'First environment', items } });
    render(Combobox, { props: { label: 'Second environment', items } });
    const inputs = screen.getAllByRole('combobox');

    expect(inputs[0].id).toBeTruthy();
    expect(inputs[1].id).toBeTruthy();
    expect(inputs[0].id).not.toBe(inputs[1].id);
    expect(screen.getByLabelText('First environment')).toBe(inputs[0]);
    expect(screen.getByLabelText('Second environment')).toBe(inputs[1]);
  });

  it('preserves supplied IDs for input and listbox references', async () => {
    render(Combobox, { props: { id: 'custom-environment', label: 'Environment', items } });
    const input = screen.getByRole('combobox', { name: 'Environment' });
    await fireEvent.focus(input);

    expect(input.id).toBe('custom-environment');
    expect(input.getAttribute('aria-controls')).toBe('custom-environment-listbox');
    expect(screen.getByRole('listbox').id).toBe('custom-environment-listbox');
  });

  it('commits the selected option and closes the listbox', async () => {
    const onChange = vi.fn();
    render(Combobox, {
      props: {
        label: 'Environment',
        items,
        onChange
      }
    });

    const input = screen.getByRole('combobox', { name: 'Environment' });
    await fireEvent.focus(input);
    await fireEvent.input(input, { target: { value: 'prod' } });
    await fireEvent.click(screen.getByRole('option', { name: 'Production' }));

    expect(onChange).toHaveBeenCalledWith({ value: 'production' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on escape', async () => {
    render(Combobox, {
      props: {
        label: 'Environment',
        items
      }
    });

    const input = screen.getByRole('combobox', { name: 'Environment' });
    await fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeTruthy();

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
