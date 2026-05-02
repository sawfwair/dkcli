import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Checkbox from './Checkbox.svelte';

describe('Checkbox', () => {
  it('renders label and helper text and toggles checked state', async () => {
    const onChange = vi.fn();
    render(Checkbox, {
      props: {
        label: 'Send release notes',
        description: 'Share the update with the team.',
        onChange
      }
    });

    const input = screen.getByLabelText('Send release notes') as HTMLInputElement;
    expect(screen.getByText('Share the update with the team.')).toBeTruthy();
    await fireEvent.click(input);
    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith({ checked: true, indeterminate: false });
  });

  it('shows the indeterminate mark and invalid messaging', () => {
    const { container } = render(Checkbox, {
      props: {
        label: 'Send release notes',
        indeterminate: true,
        error: 'Pick a definitive state.'
      }
    });

    expect(container.querySelector('.dk-checkbox')?.getAttribute('data-indeterminate')).toBe('true');
    expect(screen.getByText('Pick a definitive state.')).toBeTruthy();
  });
});
