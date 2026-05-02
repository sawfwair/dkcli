import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Tabs from './Tabs.svelte';

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details' }
];

describe('Tabs', () => {
  it('renders the tab list and switches panels on click', async () => {
    const onChange = vi.fn();
    render(Tabs, {
      props: {
        items,
        panels: {
          overview: 'Overview panel',
          details: 'Details panel'
        },
        onChange
      }
    });

    expect(screen.getByText('Overview panel')).toBeTruthy();
    await fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(screen.getByText('Details panel')).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith({ value: 'details' });
  });
});
