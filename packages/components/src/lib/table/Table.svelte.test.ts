import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';

import Table from './Table.svelte';

describe('Table', () => {
  const columns = [
    { key: 'release', header: 'Release', sortable: true },
    { key: 'owner', header: 'Owner' }
  ];

  const rows = [
    { id: 'apollo', release: 'Apollo', owner: 'Nina' },
    { id: 'zephyr', release: 'Zephyr', owner: 'Rafi' }
  ];

  it('marks the header checkbox indeterminate when only some rows are selected', () => {
    render(Table, {
      props: {
        caption: 'Release table',
        columns,
        rows,
        selectable: true,
        selectedRowIds: ['apollo']
      }
    });

    const headerCheckbox = screen.getByRole('checkbox', { name: /Select all rows/i }) as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);
  });

  it('updates aria-sort as sorting changes', async () => {
    render(Table, {
      props: {
        caption: 'Release table',
        columns,
        rows,
        sortable: true
      }
    });

    const getReleaseHeader = (): HTMLElement => screen.getByRole('columnheader', { name: /Release/i });
    expect(getReleaseHeader().getAttribute('aria-sort')).toBe('none');

    await fireEvent.click(screen.getByRole('button', { name: /Release/i }));
    await tick();
    expect(getReleaseHeader().getAttribute('aria-sort')).toBe('ascending');

    await fireEvent.click(screen.getByRole('button', { name: /Release/i }));
    await tick();
    expect(getReleaseHeader().getAttribute('aria-sort')).toBe('descending');
  });
});
