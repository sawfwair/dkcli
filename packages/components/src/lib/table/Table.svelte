<script context="module" lang="ts">
  export type TableRow = { id: string } & Record<string, unknown>;
  export type TableColumn = {
    key: string;
    header: string;
    align?: 'start' | 'center' | 'end';
    width?: string;
    sortable?: boolean;
    accessor?: string | ((row: TableRow) => string | number | null | undefined);
    format?: (value: unknown, row: TableRow) => string;
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    formatTableValue,
    sortTableRows,
    toggleAllSelection,
    toggleSelection,
    toggleSortDirection,
    type TableSortDirection
  } from '../internal/behavior/index.js';
  import {
    DEFAULT_TABLE_THEME,
    createTableRegistration,
    getTableRecipeCase,
    serializeTableSlotStyles
  } from './table.recipe.js';
  import type { TableSize } from './table.spec.js';

  const dispatch = createEventDispatcher<{
    sortchange: { sortBy: string; sortDirection: TableSortDirection };
    selectionchange: { ids: string[] };
  }>();

  export let columns: TableColumn[] = [];
  export let rows: TableRow[] = [];
  export let caption: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let size: TableSize = 'md';
  export let selectable = false;
  export let sortable = false;
  export let stickyHeader = false;
  export let sortBy: string | undefined = undefined;
  export let sortDirection: TableSortDirection = 'asc';
  export let selectedRowIds: string[] = [];
  export let emptyTitle = 'No rows yet';
  export let emptyDescription = 'Add data to see this table populate.';
  export let theme: ThemeContract = DEFAULT_TABLE_THEME;
  export let onSortChange:
    | ((detail: { sortBy: string; sortDirection: TableSortDirection }) => void)
    | undefined = undefined;
  export let onSelectionChange: ((detail: { ids: string[] }) => void) | undefined = undefined;

  const defaultRegistration = createTableRegistration(DEFAULT_TABLE_THEME);

  let registration = defaultRegistration;
  let compiledCase = getTableRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeTableSlotStyles(compiledCase);
  let internalSortBy = sortBy;
  let internalSortDirection = sortDirection;
  let internalSelectedRowIds = [...selectedRowIds];
  let previousSelectedKey = selectedRowIds.join('|');
  let previousSortKey = `${sortBy ?? ''}:${sortDirection}`;
  let headerCheckbox: HTMLInputElement | null = null;
  let sortableColumnKeys = new Set<string>();
  let sortStateByColumn: Record<string, { ariaSort: 'ascending' | 'descending' | 'none'; indicator: string }> = {};

  $: registration =
    theme.name === DEFAULT_TABLE_THEME.name ? defaultRegistration : createTableRegistration(theme);
  $: compiledCase = getTableRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeTableSlotStyles(compiledCase);
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
  $: activeSortColumn = columns.find((column) => column.key === internalSortBy);
  $: sortedRows =
    activeSortColumn && sortableColumnKeys.has(activeSortColumn.key)
      ? sortTableRows(rows, columns, internalSortBy, internalSortDirection)
      : rows;
  $: selectableRowIds = selectable ? sortedRows.map((row) => row.id) : [];
  $: allSelected =
    selectableRowIds.length > 0 &&
    selectableRowIds.every((rowId) => internalSelectedRowIds.includes(rowId));
  $: partiallySelected =
    selectableRowIds.some((rowId) => internalSelectedRowIds.includes(rowId)) && !allSelected;
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

  function updateSort(column: TableColumn): void {
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

  function rowLabel(row: TableRow): string {
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
</script>

<div class="dk-table" style={slotStyles.root} data-size={size}>
  {#if caption || description}
    <div class="table-copy">
      {#if caption}
        <h3 class="table-caption" style={slotStyles.caption}>{caption}</h3>
      {/if}
      {#if description}
        <p class="table-description" style={slotStyles.description}>{description}</p>
      {/if}
    </div>
  {/if}

  <div
    class="table-shell"
    class:sticky={stickyHeader}
    style={slotStyles.shell}
    role="region"
    aria-label={caption ?? 'Data table'}
  >
    <table class="table-element">
      {#if caption || description}
        <caption class="sr-only">{caption ?? 'Data table'}{#if description} — {description}{/if}</caption>
      {/if}
      <thead>
        <tr>
          {#if selectable}
            <th
              class="table-header-cell checkbox-column"
              role="columnheader"
              scope="col"
              style={slotStyles.headerCell}
            >
              <label class="checkbox-hit" style={slotStyles.checkbox}>
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
          {#each columns as column (column.key)}
            <th
              class="table-header-cell"
              role="columnheader"
              style={slotStyles.headerCell}
              style:width={column.width}
              scope="col"
              aria-sort={sortStateByColumn[column.key]?.ariaSort ?? 'none'}
              data-align={column.align ?? 'start'}
            >
              {#if sortableColumnKeys.has(column.key)}
                <button
                  class="sort-button"
                  type="button"
                  style={slotStyles.sortButton}
                  onclick={() => updateSort(column)}
                >
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
            <td
              class="table-empty-cell"
              style={slotStyles.empty}
              colspan={columns.length + (selectable ? 1 : 0)}
            >
              <div class="table-empty">
                <strong>{emptyTitle}</strong>
                <p>{emptyDescription}</p>
              </div>
            </td>
          </tr>
        {:else}
          {#each sortedRows as row (row.id)}
            <tr
              class="table-row"
              style={slotStyles.bodyRow}
              data-selected={internalSelectedRowIds.includes(row.id)}
              aria-selected={selectable ? (internalSelectedRowIds.includes(row.id) ? 'true' : 'false') : undefined}
            >
              {#if selectable}
                <td class="table-cell checkbox-column" style={slotStyles.cell}>
                  <label class="checkbox-hit" style={slotStyles.checkbox}>
                    <input
                      type="checkbox"
                      checked={internalSelectedRowIds.includes(row.id)}
                      aria-label={`Select row ${rowLabel(row)}`}
                      onchange={() => toggleRow(row.id)}
                    />
                  </label>
                </td>
              {/if}
              {#each columns as column (column.key)}
                <td
                  class="table-cell"
                  style={slotStyles.cell}
                  data-align={column.align ?? 'start'}
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
  .dk-table {
    display: grid;
    gap: var(--dk-table-gap);
  }

  .table-copy {
    display: grid;
    gap: 0.35rem;
  }

  .table-caption,
  .table-description,
  .table-empty p {
    margin: 0;
  }

  .table-caption {
    color: var(--dk-table-caption-color);
    font-size: var(--dk-table-caption-size);
    font-weight: var(--dk-table-caption-weight);
    line-height: 1.2;
  }

  .table-description {
    color: var(--dk-table-description-color);
    font-size: var(--dk-table-description-size);
    line-height: 1.5;
  }

  .table-shell {
    background: var(--dk-table-shell-bg);
    border: 1px solid var(--dk-table-shell-border);
    border-radius: var(--dk-table-shell-radius);
    box-shadow: var(--dk-table-shell-shadow);
    color: var(--dk-table-shell-fg);
    overflow-x: auto;
  }

  .table-element {
    border-collapse: separate;
    border-spacing: 0;
    min-width: var(--dk-table-shell-min-width);
    width: 100%;
  }

  .table-header-cell,
  .table-cell,
  .table-empty-cell {
    border-bottom: 1px solid var(--dk-table-shell-border);
    padding: 0 var(--dk-table-inline-padding);
    text-align: start;
    vertical-align: middle;
  }

  .table-header-cell {
    background: var(--dk-table-header-bg);
    color: var(--dk-table-header-fg);
    font-size: var(--dk-table-header-size);
    font-weight: var(--dk-table-header-weight);
    min-height: var(--dk-table-row-block-size);
    position: relative;
  }

  .table-shell.sticky .table-header-cell {
    position: sticky;
    top: 0;
    z-index: 1;
    box-shadow: inset 0 -1px 0 var(--dk-table-shell-border), var(--dk-table-shell-shadow);
  }

  .table-row:hover .table-cell {
    background: var(--dk-table-row-hover-bg);
  }

  .table-row[data-selected='true'] .table-cell {
    background: var(--dk-table-row-selected-bg);
    color: var(--dk-table-row-selected-fg);
  }

  .table-cell {
    color: var(--dk-table-cell-color);
    font-size: var(--dk-table-cell-size);
    line-height: 1.45;
    min-height: var(--dk-table-row-block-size);
  }

  .table-header-cell[data-align='center'],
  .table-cell[data-align='center'] {
    text-align: center;
  }

  .table-header-cell[data-align='end'],
  .table-cell[data-align='end'] {
    text-align: end;
  }

  .sort-button {
    align-items: center;
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    gap: 0.45rem;
    min-block-size: var(--dk-table-sort-target);
    padding: 0;
  }

  .sort-button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-table-sort-fg) 25%, transparent);
    outline-offset: 2px;
  }

  .sort-indicator {
    color: var(--dk-table-sort-fg);
    font-size: var(--dk-table-sort-size);
  }

  .checkbox-column {
    width: 3.5rem;
  }

  .checkbox-hit {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    min-block-size: var(--dk-table-checkbox-target);
    min-inline-size: var(--dk-table-checkbox-target);
  }

  .checkbox-hit input {
    accent-color: var(--dk-table-checkbox-checked-bg);
    block-size: var(--dk-table-checkbox-size);
    inline-size: var(--dk-table-checkbox-size);
    margin: 0;
  }

  .table-empty-cell {
    border-bottom: 0;
    padding: 1.5rem;
  }

  .table-empty {
    background: var(--dk-table-empty-bg);
    color: var(--dk-table-empty-fg);
    display: grid;
    gap: 0.35rem;
    text-align: center;
  }

  .table-empty strong {
    font-size: var(--dk-table-empty-title-size);
  }

  .sr-only {
    block-size: 1px;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    inline-size: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
  }
</style>
