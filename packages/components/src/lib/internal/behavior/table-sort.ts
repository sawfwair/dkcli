export type TableSortDirection = 'asc' | 'desc';

export type TableSortColumn<Row extends { id: string } & Record<string, unknown>> = {
  key: string;
  accessor?: string | ((row: Row) => string | number | null | undefined);
  format?: (value: unknown, row: Row) => string;
};

export function resolveTableValue<Row extends { id: string } & Record<string, unknown>>(
  row: Row,
  column: TableSortColumn<Row>
): unknown {
  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }
  if (typeof column.accessor === 'string') {
    return row[column.accessor];
  }
  return row[column.key];
}

export function formatTableValue<Row extends { id: string } & Record<string, unknown>>(
  row: Row,
  column: TableSortColumn<Row>
): string {
  const value = resolveTableValue(row, column);
  if (column.format) {
    return column.format(value, row);
  }
  if (value === null || value === undefined) {
    return '—';
  }
  return String(value);
}

export function sortTableRows<Row extends { id: string } & Record<string, unknown>>(
  rows: Row[],
  columns: TableSortColumn<Row>[],
  sortBy: string | undefined,
  direction: TableSortDirection
): Row[] {
  if (!sortBy) {
    return rows;
  }

  const column = columns.find((entry) => entry.key === sortBy);
  if (!column) {
    return rows;
  }

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const factor = direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = resolveTableValue(left, column);
    const rightValue = resolveTableValue(right, column);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * factor;
    }

    return collator.compare(String(leftValue ?? ''), String(rightValue ?? '')) * factor;
  });
}

export function toggleSortDirection(input: {
  currentSortBy?: string;
  currentDirection?: TableSortDirection;
  nextColumn: string;
}): { sortBy: string; sortDirection: TableSortDirection } {
  if (input.currentSortBy !== input.nextColumn) {
    return { sortBy: input.nextColumn, sortDirection: 'asc' };
  }

  return {
    sortBy: input.nextColumn,
    sortDirection: input.currentDirection === 'asc' ? 'desc' : 'asc'
  };
}

export function toggleSelection(ids: string[], rowId: string): string[] {
  return ids.includes(rowId) ? ids.filter((id) => id !== rowId) : [...ids, rowId];
}

export function toggleAllSelection(current: string[], allIds: string[]): string[] {
  const allSelected = allIds.length > 0 && allIds.every((id) => current.includes(id));
  return allSelected ? [] : [...allIds];
}
