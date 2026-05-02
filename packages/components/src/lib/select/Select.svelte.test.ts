import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import Select from './Select.svelte';

describe('Select', () => {
  const items = [
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ];

  it('returns focus to the trigger after selecting an option', async () => {
    render(Select, {
      props: {
        label: 'Environment',
        items
      }
    });

    const trigger = screen.getByRole('button', { name: /select an option/i });
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

    const trigger = screen.getByRole('button', { name: /select an option/i });
    await fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeTruthy();

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
