import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import DataGridLite from './DataGridLite.svelte';

describe('DataGridLite', () => {
  const columns = [
    { key: 'release', header: 'Release', sortable: true },
    { key: 'owner', header: 'Owner' }
  ];

  const rows = [
    { id: 'a', release: 'Apollo', owner: 'Nina' },
    { id: 'b', release: 'Zephyr', owner: 'Rafi' }
  ];

  it('sorts and reports active-cell movement', async () => {
    const onSortChange = vi.fn();
    const onActiveCellChange = vi.fn();

    render(DataGridLite, {
      props: {
        columns,
        rows,
        sortable: true,
        onSortChange,
        onActiveCellChange
      }
    });

    await fireEvent.click(screen.getByRole('button', { name: /Release/i }));
    expect(onSortChange).toHaveBeenCalledWith({ sortBy: 'release', sortDirection: 'asc' });
  });

  it('moves focus across cells with the keyboard', async () => {
    const onActiveCellChange = vi.fn();
    render(DataGridLite, {
      props: {
        columns,
        rows,
        selectable: true,
        onActiveCellChange
      }
    });

    const atlasCell = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.textContent?.includes('Apollo'));

    expect(atlasCell).toBeTruthy();
    await fireEvent.focus(atlasCell!);
    await fireEvent.keyDown(atlasCell!, { key: 'ArrowRight' });
    await fireEvent.keyDown(screen.getAllByRole('gridcell').find((cell) => cell.textContent?.includes('Nina'))!, {
      key: 'ArrowDown'
    });

    expect(onActiveCellChange).toHaveBeenCalledWith({ activeCell: { row: 0, col: 2 } });
    expect(onActiveCellChange).toHaveBeenCalledWith({ activeCell: { row: 1, col: 2 } });
  });

  it('does not re-emit active-cell changes when the current cell receives focus again', async () => {
    const onActiveCellChange = vi.fn();
    render(DataGridLite, {
      props: {
        columns,
        rows,
        selectable: true,
        onActiveCellChange
      }
    });

    const currentCell = screen
      .getAllByRole('gridcell')
      .find((cell) => cell.textContent?.includes('Apollo'));

    expect(currentCell).toBeTruthy();
    await fireEvent.focus(currentCell!);

    expect(onActiveCellChange).not.toHaveBeenCalled();
  });

  it('selects every row from the header checkbox', async () => {
    const onSelectionChange = vi.fn();
    render(DataGridLite, {
      props: {
        columns,
        rows,
        selectable: true,
        onSelectionChange
      }
    });

    await fireEvent.click(screen.getByRole('checkbox', { name: /Select all rows/i }));

    expect((screen.getByRole('checkbox', { name: /Select row Apollo/i }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: /Select row Zephyr/i }) as HTMLInputElement).checked).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledWith({ ids: ['a', 'b'] });
  });
});
