import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Pagination from './Pagination.svelte';

describe('Pagination', () => {
  it('retains keyboard focus when the chosen page becomes current', async () => {
    const onChange = vi.fn();
    render(Pagination, { props: { page: 1, pageCount: 8, onChange } });
    const second = screen.getByRole('button', { name: '2' });
    second.focus();
    await fireEvent.click(second);
    expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement?.textContent?.trim()).toBe('2');
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ page: 2 });
    await fireEvent.click(document.activeElement!);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('retains the chosen page focus when the visible page window changes', async () => {
    render(Pagination, { props: { page: 4, pageCount: 8 } });
    const last = screen.getByRole('button', { name: '8' });
    last.focus();
    await fireEvent.click(last);
    expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement?.textContent?.trim()).toBe('8');
  });

  it('emits a change event when the user advances pages', async () => {
    const onChange = vi.fn();
    render(Pagination, {
      props: {
        page: 2,
        pageCount: 8,
        onChange
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onChange).toHaveBeenCalledWith({ page: 3 });
  });
});
