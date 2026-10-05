import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import SegmentedControl from './SegmentedControl.svelte';

describe('SegmentedControl', () => {
  it('retains an enabled tab entry point when the selected option becomes disabled', async () => {
    const { rerender } = render(SegmentedControl, { props: { items: [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }], value: 'one' } });
    await rerender({ items: [{ value: 'one', label: 'One', disabled: true }, { value: 'two', label: 'Two' }] });
    expect(screen.getByRole('radio', { name: 'Two' }).tabIndex).toBe(0);
    expect(screen.getByRole('radio', { name: 'One' }).tabIndex).toBe(-1);
  });

  it('navigates from the focused enabled option and skips disabled options', async () => {
    const onChange = vi.fn();
    render(SegmentedControl, { props: { items: [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }, { value: 'blocked', label: 'Blocked', disabled: true }, { value: 'four', label: 'Four' }], value: 'one', onChange } });
    const second = screen.getByRole('radio', { name: 'Two' });
    second.focus();
    await fireEvent.keyDown(second, { key: 'ArrowRight' });
    const fourth = screen.getByRole('radio', { name: 'Four' });
    expect(document.activeElement).toBe(fourth);
    expect(fourth.getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'four' });
  });

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
