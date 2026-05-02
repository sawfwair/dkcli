import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import Pagination from './Pagination.svelte';

describe('Pagination', () => {
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
