import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Switch from './Switch.svelte';

describe('Switch', () => {
  it('toggles the native checkbox state and shows the description', async () => {
    const onChange = vi.fn();
    render(Switch, {
      props: {
        label: 'Auto publish',
        description: 'Ship the update as soon as it passes.',
        onChange
      }
    });

    const input = screen.getByLabelText('Auto publish') as HTMLInputElement;
    expect(screen.getByText('Ship the update as soon as it passes.')).toBeTruthy();
    await fireEvent.click(input);
    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ checked: true });
  });
});
