import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import SegmentedControl from './SegmentedControl.svelte';

describe('SegmentedControl', () => {
  it('selects a clicked item and reports the change', async () => {
    const onChange = vi.fn();
    render(SegmentedControl, {
      props: {
        items: [
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' }
        ],
        value: 'week',
        onChange
      }
    });

    const month = screen.getByRole('radio', { name: 'Month' });
    await fireEvent.click(month);

    expect(month.getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenCalledWith({ value: 'month' });
  });
});
