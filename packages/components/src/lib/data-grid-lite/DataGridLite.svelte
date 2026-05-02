<script context="module" lang="ts">
  export type DataGridLiteRow = { id: string } & Record<string, unknown>;
  export type DataGridLiteColumn = {
    key: string;
    header: string;
    align?: 'start' | 'center' | 'end';
    width?: string;
    sortable?: boolean;
    accessor?: string | ((row: DataGridLiteRow) => string | number | null | undefined);
    format?: (value: unknown, row: DataGridLiteRow) => string;
  };

  export type ActiveGridCell = {
    row: number;
    col: number;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    formatTableValue,
    moveGridCell,
    sortTableRows,
    toggleAllSelection,
    toggleSelection,
    toggleSortDirection,
    type TableSortDirection
  } from '../internal/behavior/index.js';
  import {
    DEFAULT_DATA_GRID_LITE_THEME,
    createDataGridLiteRegistration,
    getDataGridLiteRecipeCase,
    serializeDataGridLiteSlotStyles
  } from './data-grid-lite.recipe.js';
  import type { DataGridLiteSize } from './data-grid-lite.spec.js';

  const dispatch = createEventDispatcher<{
    sortchange: { sortBy: string; sortDirection: TableSortDirection };
    selectionchange: { ids: string[] };
    activecellchange: { activeCell: ActiveGridCell };
  }>();

  export let columns: DataGridLiteColumn[] = [];
  export let rows: DataGridLiteRow[] = [];
  export let caption: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let size: DataGridLiteSize = 'md';
  export let sortable = false;
  export let selectable = false;
  export let pinnedColumns = 0;
  export let activeCell: ActiveGridCell | undefined = undefined;
  export let sortBy: string | undefined = undefined;
  export let sortDirection: TableSortDirection = 'asc';
  export let selectedRowIds: string[] = [];
  export let emptyTitle = 'No grid rows yet';
  export let emptyDescription = 'Add structured data to see the grid.';
  export let theme: ThemeContract = DEFAULT_DATA_GRID_LITE_THEME;
  export let onSortChange:
    | ((detail: { sortBy: string; sortDirection: TableSortDirection }) => void)
    | undefined = undefined;
  export let onSelectionChange: ((detail: { ids: string[] }) => void) | undefined = undefined;
  export let onActiveCellChange: ((detail: { activeCell: ActiveGridCell }) => void) | undefined = undefined;

  const defaultRegistration = createDataGridLiteRegistration(DEFAULT_DATA_GRID_LITE_THEME);

  let registration = defaultRegistration;
  let compiledCase = getDataGridLiteRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeDataGridLiteSlotStyles(compiledCase);
  let internalSortBy = sortBy;
  let internalSortDirection = sortDirection;
  let internalSelectedRowIds = [...selectedRowIds];
  let previousSelectedKey = selectedRowIds.join('|');
  let previousSortKey = `${sortBy ?? ''}:${sortDirection}`;
  let internalActiveCell = activeCell ?? { row: 0, col: selectable ? 1 : 0 };
  let previousActiveKey = `${activeCell?.row ?? 0}:${activeCell?.col ?? 0}`;
  let headerCheckbox: HTMLInputElement | null = null;
  let cellRefs: HTMLTableCellElement[][] = [];
  let sortableColumnKeys = new Set<string>();
  let sortStateByColumn: Record<string, { ariaSort: 'ascending' | 'descending' | 'none'; indicator: string }> = {};

  $: registration =
    theme.name === DEFAULT_DATA_GRID_LITE_THEME.name
      ? defaultRegistration
      : createDataGridLiteRegistration(theme);
  $: compiledCase = getDataGridLiteRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeDataGridLiteSlotStyles(compiledCase);
  $: nextSortKey = `${sortBy ?? ''}:${sortDirection}`;
  $: if (nextSortKey !== previousSortKey) {
    internalSortBy = sortBy;
    internalSortDirection = sortDirection;
    previousSortKey = nextSortKey;
  }
  $: nextSelectedKey = selectedRowIds.join('|');
  $: if (nextSelectedKey !== previousSelectedKey) {
    internalSelectedRowIds = [...selectedRowIds];
    previousSelectedKey = nextSelectedKey;
  }
  $: nextActiveKey = `${activeCell?.row ?? 0}:${activeCell?.col ?? 0}`;
  $: if (nextActiveKey !== previousActiveKey) {
    internalActiveCell = activeCell ?? { row: 0, col: selectable ? 1 : 0 };
    previousActiveKey = nextActiveKey;
  }
  $: sortedRows =
    internalSortBy
      ? sortTableRows(rows, columns, internalSortBy, internalSortDirection)
      : rows;
  $: selectableRowIds = selectable ? sortedRows.map((row: DataGridLiteRow) => row.id) : [];
  $: allSelected =
    selectableRowIds.length > 0 &&
    selectableRowIds.every((rowId: string) => internalSelectedRowIds.includes(rowId));
  $: partiallySelected =
    selectableRowIds.some((rowId: string) => internalSelectedRowIds.includes(rowId)) && !allSelected;
  $: sortableColumnKeys = new Set(
    columns.filter((column) => column.sortable ?? sortable).map((column) => column.key)
  );
  $: sortStateByColumn = Object.fromEntries(
    columns.map((column) => {
      const sortableColumn = sortableColumnKeys.has(column.key);
      const active = sortableColumn && internalSortBy === column.key;

      return [
        column.key,
        {
          ariaSort: !active ? 'none' : internalSortDirection === 'asc' ? 'ascending' : 'descending',
          indicator: !active ? '↕' : internalSortDirection === 'asc' ? '↑' : '↓'
        }
      ];
    })
  );
  $: if (headerCheckbox) {
    headerCheckbox.indeterminate = partiallySelected;
  }

  function updateSort(column: DataGridLiteColumn): void {
    if (!sortableColumnKeys.has(column.key)) {
      return;
    }

    const next = toggleSortDirection({
      currentSortBy: internalSortBy,
      currentDirection: internalSortDirection,
      nextColumn: column.key
    });

    internalSortBy = next.sortBy;
    internalSortDirection = next.sortDirection;
    sortBy = next.sortBy;
    sortDirection = next.sortDirection;
    onSortChange?.(next);
    dispatch('sortchange', next);
  }

  function updateSelection(ids: string[]): void {
    internalSelectedRowIds = ids;
    selectedRowIds = ids;
    onSelectionChange?.({ ids });
    dispatch('selectionchange', { ids });
  }

  function updateActiveCell(nextCell: ActiveGridCell, options: { focusTarget?: boolean } = {}): void {
    if (nextCell.row === internalActiveCell.row && nextCell.col === internalActiveCell.col) {
      return;
    }

    internalActiveCell = nextCell;
    onActiveCellChange?.({ activeCell: nextCell });
    dispatch('activecellchange', { activeCell: nextCell });
    if (options.focusTarget ?? true) {
      void tick().then(() => {
        cellRefs[nextCell.row]?.[nextCell.col]?.focus();
      });
    }
  }

  function rowLabel(row: DataGridLiteRow): string {
    const firstColumn = columns[0];
    if (!firstColumn) {
      return row.id;
    }
    return formatTableValue(row, firstColumn);
  }

  function toggleRow(rowId: string): void {
    updateSelection(toggleSelection(internalSelectedRowIds, rowId));
  }

  function toggleAllRows(): void {
    updateSelection(toggleAllSelection(internalSelectedRowIds, selectableRowIds));
  }

  function handleCellKeydown(event: KeyboardEvent): void {
    const nextCell = moveGridCell(
      internalActiveCell,
      event.key,
      Math.max(1, sortedRows.length),
      Math.max(1, columns.length + (selectable ? 1 : 0))
    );
    if (nextCell.row !== internalActiveCell.row || nextCell.col !== internalActiveCell.col) {
      updateActiveCell(nextCell, { focusTarget: true });
      event.preventDefault();
    }
  }

  function stickyOffset(cellIndex: number): string | undefined {
    if (pinnedColumns <= 0 || cellIndex >= pinnedColumns) {
      return undefined;
    }
    return cellIndex === 0 ? '0px' : undefined;
  }

  function registerCell(node: HTMLTableCellElement, position: { row: number; col: number }) {
    cellRefs[position.row] ??= [];
    cellRefs[position.row][position.col] = node;
    return {
      destroy() {
        if (cellRefs[position.row]) {
          delete cellRefs[position.row][position.col];
        }
      }
    };
  }
</script>

<div class="dk-grid" style={slotStyles.root} data-size={size}>
  {#if caption || description}
    <div class="grid-copy">
      {#if caption}
        <h3 class="grid-caption" style={slotStyles.caption}>{caption}</h3>
      {/if}
      {#if description}
        <p class="grid-description" style={slotStyles.description}>{description}</p>
      {/if}
    </div>
  {/if}

  <div class="grid-shell" style={slotStyles.shell} role="region" aria-label={caption ?? 'Data grid'}>
    <table class="grid-table" role="grid" aria-rowcount={sortedRows.length} aria-colcount={columns.length + (selectable ? 1 : 0)}>
      {#if caption || description}
        <caption class="sr-only">{caption ?? 'Data grid'}{#if description} — {description}{/if}</caption>
      {/if}
      <thead>
        <tr>
          {#if selectable}
            <th
              class="grid-header-cell checkbox-column"
              scope="col"
              role="columnheader"
              style={slotStyles.headerCell}
              style:left={stickyOffset(0)}
              class:pinned={pinnedColumns > 0}
            >
              <label class="checkbox-hit">
                <input
                  bind:this={headerCheckbox}
                  type="checkbox"
                  aria-label="Select all rows"
                  aria-checked={partiallySelected ? 'mixed' : allSelected ? 'true' : 'false'}
                  checked={allSelected}
                  onchange={toggleAllRows}
                />
              </label>
            </th>
          {/if}
          {#each columns as column, columnIndex (column.key)}
            {@const gridColIndex = columnIndex + (selectable ? 1 : 0)}
            <th
              class="grid-header-cell"
              role="columnheader"
              style={slotStyles.headerCell}
              style:width={column.width}
              scope="col"
              aria-sort={sortStateByColumn[column.key]?.ariaSort ?? 'none'}
              data-align={column.align ?? 'start'}
              style:left={stickyOffset(gridColIndex)}
              class:pinned={pinnedColumns > 0 && gridColIndex < pinnedColumns}
            >
              {#if sortableColumnKeys.has(column.key)}
                <button class="sort-button" type="button" style={slotStyles.sortButton} onclick={() => updateSort(column)}>
                  <span>{column.header}</span>
                  <span class="sort-indicator" aria-hidden="true">
                    {sortStateByColumn[column.key]?.indicator ?? '↕'}
                  </span>
                </button>
              {:else}
                <span>{column.header}</span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if sortedRows.length === 0}
          <tr>
            <td class="grid-empty-cell" style={slotStyles.empty} colspan={columns.length + (selectable ? 1 : 0)}>
              <div class="grid-empty">
                <strong>{emptyTitle}</strong>
                <p>{emptyDescription}</p>
              </div>
            </td>
          </tr>
        {:else}
          {#each sortedRows as row, rowIndex (row.id)}
            <tr class="grid-row" data-selected={internalSelectedRowIds.includes(row.id)}>
              {#if selectable}
                <td
                  use:registerCell={{ row: rowIndex, col: 0 }}
                  class="grid-cell checkbox-column"
                  style={slotStyles.cell}
                  role="gridcell"
                  tabindex={internalActiveCell.row === rowIndex && internalActiveCell.col === 0 ? 0 : -1}
                  onfocus={() => updateActiveCell({ row: rowIndex, col: 0 }, { focusTarget: false })}
                  onkeydown={handleCellKeydown}
                  style:left={stickyOffset(0)}
                  class:pinned={pinnedColumns > 0}
                >
                  <label class="checkbox-hit">
                    <input
                      type="checkbox"
                      checked={internalSelectedRowIds.includes(row.id)}
                      aria-label={`Select row ${rowLabel(row)}`}
                      onchange={() => toggleRow(row.id)}
                    />
                  </label>
                </td>
              {/if}
              {#each columns as column, columnIndex (column.key)}
                {@const gridColIndex = columnIndex + (selectable ? 1 : 0)}
                <td
                  use:registerCell={{ row: rowIndex, col: gridColIndex }}
                  class="grid-cell"
                  role="gridcell"
                  style={slotStyles.cell}
                  tabindex={internalActiveCell.row === rowIndex && internalActiveCell.col === gridColIndex ? 0 : -1}
                  data-selected={internalActiveCell.row === rowIndex && internalActiveCell.col === gridColIndex}
                  data-align={column.align ?? 'start'}
                  onfocus={() => updateActiveCell({ row: rowIndex, col: gridColIndex }, { focusTarget: false })}
                  onkeydown={handleCellKeydown}
                  style:left={stickyOffset(gridColIndex)}
                  class:pinned={pinnedColumns > 0 && gridColIndex < pinnedColumns}
                >
                  {formatTableValue(row, column)}
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .dk-grid,
  .grid-copy {
    display: grid;
    gap: var(--dk-grid-gap);
  }

  .grid-caption,
  .grid-description,
  .grid-empty p {
    margin: 0;
  }

  .grid-caption {
    color: var(--dk-grid-caption-color);
    font-size: var(--dk-grid-caption-size);
    font-weight: var(--dk-grid-caption-weight);
  }

  .grid-description {
    color: var(--dk-grid-description-color);
    font-size: var(--dk-grid-description-size);
  }

  .grid-shell {
    background: var(--dk-grid-shell-bg);
    border: 1px solid var(--dk-grid-shell-border);
    border-radius: var(--dk-grid-shell-radius);
    box-shadow: var(--dk-grid-shell-shadow);
    overflow: auto;
  }

  .grid-table {
    border-collapse: separate;
    border-spacing: 0;
    min-width: var(--dk-grid-shell-min-width);
    width: 100%;
  }

  .grid-header-cell,
  .grid-cell {
    background: var(--dk-grid-cell-bg, transparent);
    border-bottom: 1px solid var(--dk-grid-shell-border);
    min-block-size: var(--dk-grid-row-block-size, 44px);
    padding: 0 var(--dk-grid-inline-padding, 0.75rem);
    position: relative;
  }

  .grid-header-cell {
    background: var(--dk-grid-header-bg);
    color: var(--dk-grid-header-fg);
    font-size: var(--dk-grid-header-size);
    font-weight: var(--dk-grid-header-weight);
    top: 0;
    z-index: 2;
  }

  .grid-cell {
    color: var(--dk-grid-cell-fg);
    font-size: var(--dk-grid-cell-size);
  }

  .grid-cell[data-selected='true'] {
    background: var(--dk-grid-cell-active-bg);
    color: var(--dk-grid-cell-active-fg);
    outline: 2px solid color-mix(in srgb, var(--dk-grid-cell-active-fg) 18%, transparent);
    outline-offset: -2px;
  }

  .grid-row[data-selected='true'] .grid-cell {
    background: color-mix(in srgb, var(--dk-grid-cell-active-bg) 30%, var(--dk-grid-cell-bg));
  }

  .sort-button {
    align-items: center;
    background: transparent;
    border: 0;
    color: var(--dk-grid-sort-fg);
    cursor: pointer;
    display: inline-flex;
    gap: 0.35rem;
    min-block-size: var(--dk-grid-sort-target);
    padding: 0;
  }

  .checkbox-column {
    width: 3rem;
  }

  .checkbox-hit {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    min-block-size: 44px;
    min-inline-size: 44px;
  }

  .pinned {
    position: sticky;
    z-index: 3;
  }

  .sr-only {
    block-size: 1px;
    clip: rect(0 0 0 0);
    inline-size: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
  }
</style>
