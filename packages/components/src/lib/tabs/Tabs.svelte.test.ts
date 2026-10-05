import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Tabs from './Tabs.svelte';

const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details' }
];

describe('Tabs', () => {
  it('retains an enabled tab entry point when the selected tab becomes disabled', async () => {
    const { rerender } = render(Tabs, { props: { items, value: 'overview' } });
    await rerender({ items: [{ value: 'overview', label: 'Overview', disabled: true }, { value: 'details', label: 'Details' }] });
    expect(screen.getByRole('tab', { name: 'Details' }).tabIndex).toBe(0);
    expect(screen.getByRole('tab', { name: 'Overview' }).tabIndex).toBe(-1);
  });

  it('moves the manual tab stop without changing panels until activation', async () => {
    const onChange = vi.fn();
    render(Tabs, { props: { items, activation: 'manual', panels: { overview: 'Overview panel', details: 'Details panel' }, onChange } });
    const overview = screen.getByRole('tab', { name: 'Overview' });
    const details = screen.getByRole('tab', { name: 'Details' });
    overview.focus();
    await fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(details);
    expect(details.tabIndex).toBe(0);
    expect(overview.tabIndex).toBe(-1);
    expect(screen.getByText('Overview panel')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.keyDown(details, { key: 'Enter' });
    expect(screen.getByText('Details panel')).toBeTruthy();
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ value: 'details' });
  });

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
