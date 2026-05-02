import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import RadioGroup from './RadioGroup.svelte';

const items = [
  { value: 'daily', label: 'Daily', description: 'Share updates every morning.' },
  { value: 'weekly', label: 'Weekly' }
];

describe('RadioGroup', () => {
  it('renders radio items and updates the selected option', async () => {
    const onChange = vi.fn();
    render(RadioGroup, {
      props: {
        label: 'Digest cadence',
        items,
        onChange
      }
    });

    const weekly = screen.getByLabelText('Weekly') as HTMLInputElement;
    await fireEvent.click(weekly);
    expect(weekly.checked).toBe(true);
    expect(screen.getByText('Share updates every morning.')).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith({ value: 'weekly' });
  });
});
