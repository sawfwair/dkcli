import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Combobox from './Combobox.svelte';

describe('Combobox', () => {
  const items = [
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ];

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
