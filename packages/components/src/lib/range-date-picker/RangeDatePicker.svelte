<script context="module" lang="ts">
  export type DateRangeValue = {
    start?: string;
    end?: string;
  };
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    addMonths,
    buildRangeCalendarPair,
    decorateRangeDay,
    isDateDisabled,
    isEventOutside,
    isRangeComplete,
    monthStartIso,
    moveDateWithinGrid,
    normalizeRange,
    selectRangeValue,
    todayIso,
    type DateRangeValue as InternalDateRangeValue
  } from '../internal/behavior/index.js';
  import { FieldFrame } from '../primitives/index.js';
  import {
    DEFAULT_RANGE_DATE_PICKER_THEME,
    createRangeDatePickerRegistration,
    getRangeDatePickerRecipeCase,
    serializeRangeDatePickerSlotStyles
  } from './range-date-picker.recipe.js';
  import type { RangeDatePickerSize } from './range-date-picker.spec.js';

  const dispatch = createEventDispatcher<{
    change: { value: InternalDateRangeValue };
    openchange: { open: boolean };
  }>();

  let nextId = 0;

  export let value: InternalDateRangeValue | undefined = undefined;
  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let placeholder = 'Select a date range';
  export let required = false;
  export let disabled = false;
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let size: RangeDatePickerSize = 'md';
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let disabledDates: string[] = [];
  export let weekStartsOn: 0 | 1 = 0;
  export let open = false;
  export let theme: ThemeContract = DEFAULT_RANGE_DATE_PICKER_THEME;
  export let onOpenChange: ((detail: { open: boolean }) => void) | undefined = undefined;
  export let onChange: ((detail: { value: InternalDateRangeValue }) => void) | undefined = undefined;

  const defaultRegistration = createRangeDatePickerRegistration(DEFAULT_RANGE_DATE_PICKER_THEME);
  const localId = `dk-range-date-picker-${++nextId}`;
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  let registration = defaultRegistration;
  let fieldId = id ?? localId;
  let compiledCase = getRangeDatePickerRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeRangeDatePickerSlotStyles(compiledCase);
  let internalValue = normalizeRange(value);
  let previousValue = JSON.stringify(value ?? {});
  let internalOpen = open;
  let previousOpen = open;
  let invalid = Boolean(error);
  let visibleMonth = monthStartIso(value?.start ?? todayIso());
  let focusedDate = value?.end ?? value?.start ?? todayIso();
  let triggerEl: HTMLButtonElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let restoreFocusEl: HTMLElement | null = null;
  let dayRefs: Record<string, HTMLButtonElement | undefined> = {};

  $: registration =
    theme.name === DEFAULT_RANGE_DATE_PICKER_THEME.name
      ? defaultRegistration
      : createRangeDatePickerRegistration(theme);
  $: fieldId = id ?? localId;
  $: compiledCase = getRangeDatePickerRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeRangeDatePickerSlotStyles(compiledCase);
  $: invalid = Boolean(error);
  $: nextValueKey = JSON.stringify(value ?? {});
  $: if (nextValueKey !== previousValue) {
    internalValue = normalizeRange(value);
    previousValue = nextValueKey;
    focusedDate = value?.end ?? value?.start ?? focusedDate;
    visibleMonth = monthStartIso(value?.start ?? visibleMonth);
  }
  $: if (open !== previousOpen) {
    internalOpen = open;
    previousOpen = open;
    if (internalOpen) {
      void syncFocus();
    }
  }
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;
  $: calendarPair = buildRangeCalendarPair({
    visibleMonth,
    value: internalValue,
    min,
    max,
    disabledDates,
    focusedDate,
    weekStartsOn
  });

  function registerDay(node: HTMLButtonElement, iso: string) {
    dayRefs[iso] = node;
    return {
      destroy() {
        delete dayRefs[iso];
      }
    };
  }

  function emitOpen(nextOpen: boolean): void {
    internalOpen = nextOpen;
    open = nextOpen;
    previousOpen = nextOpen;
    onOpenChange?.({ open: nextOpen });
    dispatch('openchange', { open: nextOpen });
  }

  function emitChange(nextValue: InternalDateRangeValue): void {
    internalValue = normalizeRange(nextValue);
    value = internalValue;
    previousValue = JSON.stringify(internalValue);
    onChange?.({ value: internalValue });
    dispatch('change', { value: internalValue });
  }

  async function syncFocus(): Promise<void> {
    await tick();
    dayRefs[focusedDate]?.focus();
  }

  function openCalendar(): void {
    if (disabled) {
      return;
    }
    restoreFocusEl =
      triggerEl ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    emitOpen(true);
    focusedDate = internalValue.end ?? internalValue.start ?? todayIso();
    visibleMonth = monthStartIso(internalValue.start ?? focusedDate);
    void syncFocus();
  }

  function closeCalendar(): void {
    const focusTarget = restoreFocusEl ?? triggerEl;
    emitOpen(false);
    focusTarget?.focus();
    void tick().then(() => {
      focusTarget?.focus();
    });
  }

  function chooseDate(iso: string): void {
    if (
      isDateDisabled({
        value: iso,
        min,
        max,
        disabledDates
      })
    ) {
      return;
    }

    focusedDate = iso;
    const nextValue = selectRangeValue(internalValue, iso);
    emitChange(nextValue);

    if (isRangeComplete(nextValue)) {
      closeCalendar();
    } else {
      visibleMonth = monthStartIso(nextValue.start ?? iso);
      void syncFocus();
    }
  }

  function shiftVisibleMonth(delta: number): void {
    visibleMonth = monthStartIso(addMonths(visibleMonth, delta));
    void syncFocus();
  }

  function syncVisibleMonthToFocus(): void {
    const focusMonth = monthStartIso(focusedDate);
    const nextMonth = monthStartIso(addMonths(visibleMonth, 1));
    if (focusMonth < visibleMonth || focusMonth > nextMonth) {
      visibleMonth = focusMonth;
    }
  }

  function handleTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      openCalendar();
      event.preventDefault();
    }
  }

  function handleDayKeydown(event: KeyboardEvent, iso: string): void {
    if (event.key === 'Escape') {
      closeCalendar();
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      chooseDate(iso);
      event.preventDefault();
      return;
    }

    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key === 'PageUp' ||
      event.key === 'PageDown'
    ) {
      focusedDate = moveDateWithinGrid(iso, event.key, weekStartsOn);
      syncVisibleMonthToFocus();
      event.preventDefault();
      void syncFocus();
    }
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeCalendar();
    }
  }

  function formatLabel(iso: string | undefined): string {
    if (!iso) {
      return '';
    }
    return dateFormatter.format(new Date(`${iso}T00:00:00`));
  }

  function formatRangeLabel(range: InternalDateRangeValue | undefined): string {
    const normalized = normalizeRange(range);
    if (!normalized.start && !normalized.end) {
      return placeholder;
    }
    if (normalized.start && !normalized.end) {
      return `${formatLabel(normalized.start)} → Pick end date`;
    }
    return `${formatLabel(normalized.start)} – ${formatLabel(normalized.end)}`;
  }
</script>

<svelte:window onclick={handleWindowClick} />

<FieldFrame
  {label}
  {description}
  {error}
  {required}
  {disabled}
  {invalid}
  fieldId={fieldId}
  rootStyle={slotStyles.root}
  labelStyle={slotStyles.label}
  descriptionStyle={slotStyles.description}
  errorStyle={slotStyles.error}
>
  {#if name}
    <input type="hidden" name={`${name}[start]`} value={internalValue.start ?? ''} />
    <input type="hidden" name={`${name}[end]`} value={internalValue.end ?? ''} />
  {/if}

  <button
    bind:this={triggerEl}
    class="range-trigger"
    style={slotStyles.trigger}
    type="button"
    aria-haspopup="dialog"
    aria-expanded={internalOpen ? 'true' : 'false'}
    aria-controls={`${fieldId}-dialog`}
    aria-describedby={describedBy}
    data-invalid={invalid ? 'true' : 'false'}
    {disabled}
    onclick={() => (internalOpen ? closeCalendar() : openCalendar())}
    onkeydown={handleTriggerKeydown}
  >
    <span class:placeholder={!internalValue.start}>{formatRangeLabel(internalValue)}</span>
    <span aria-hidden="true">◷</span>
  </button>
</FieldFrame>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    class="range-surface"
    style={slotStyles.surface}
    id={`${fieldId}-dialog`}
    role="dialog"
    aria-label="Choose date range"
  >
    <div class="range-toolbar">
      <button
        class="range-nav"
        style={slotStyles.navButton}
        type="button"
        aria-label="Previous month"
        onclick={() => shiftVisibleMonth(-1)}
      >
        ‹
      </button>
      <button
        class="range-nav"
        style={slotStyles.navButton}
        type="button"
        aria-label="Next month"
        onclick={() => shiftVisibleMonth(1)}
      >
        ›
      </button>
    </div>

    <div class="range-months">
      {#each calendarPair.months as month}
        <section class="range-month" aria-label={month.monthLabel}>
          <h3 class="range-caption" style={slotStyles.caption}>{month.monthLabel}</h3>
          <div class="range-grid" role="grid" aria-label={month.monthLabel}>
            {#each month.weekdayLabels as weekday (weekday)}
              <span class="range-weekday" role="columnheader" style={slotStyles.weekday}>{weekday}</span>
            {/each}

            {#each month.weeks as week (week.index)}
              {#each week.days.map((day) => decorateRangeDay(day, internalValue)) as day (day.iso)}
                <button
                  use:registerDay={day.iso}
                  class="range-day"
                  style={slotStyles.day}
                  type="button"
                  aria-label={formatLabel(day.iso)}
                  aria-current={day.today ? 'date' : undefined}
                  data-selected={day.edge ? 'true' : 'false'}
                  data-in-range={day.inRange && !day.edge ? 'true' : 'false'}
                  data-outside={day.outsideMonth ? 'true' : 'false'}
                  data-today={day.today ? 'true' : 'false'}
                  tabindex={day.focused ? 0 : -1}
                  disabled={day.disabled}
                  onclick={() => chooseDate(day.iso)}
                  onkeydown={(event) => handleDayKeydown(event, day.iso)}
                >
                  {day.day}
                </button>
              {/each}
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </div>
{/if}

<style>
  .range-trigger {
    align-items: center;
    appearance: none;
    background: var(--dk-range-trigger-bg);
    border: 1px solid var(--dk-range-trigger-border);
    border-radius: var(--dk-range-trigger-radius);
    color: var(--dk-range-trigger-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-range-trigger-block-size);
    padding: 0 var(--dk-range-trigger-inline-padding);
    width: 100%;
  }

  .range-trigger .placeholder {
    color: color-mix(in srgb, var(--dk-range-trigger-fg) 64%, transparent);
  }

  .range-trigger:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-range-trigger-border) 24%, transparent);
    outline-offset: 2px;
  }

  .range-surface {
    background: var(--dk-range-surface-bg);
    border: 1px solid var(--dk-range-surface-border);
    border-radius: var(--dk-range-surface-radius);
    box-shadow: var(--dk-range-surface-shadow);
    color: var(--dk-range-surface-fg);
    display: grid;
    gap: 0.75rem;
    inline-size: min(var(--dk-range-surface-width), calc(100vw - 2rem));
    margin-top: 0.5rem;
    padding: var(--dk-range-surface-padding);
    position: relative;
  }

  .range-toolbar,
  .range-months,
  .range-month,
  .range-grid {
    display: grid;
  }

  .range-toolbar {
    gap: 0.5rem;
    grid-auto-flow: column;
    justify-content: end;
  }

  .range-months {
    gap: 1rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .range-month {
    gap: 0.75rem;
  }

  .range-caption {
    color: var(--dk-range-caption-color);
    font-size: var(--dk-range-caption-size);
    font-weight: var(--dk-range-caption-weight);
    margin: 0;
  }

  .range-grid {
    align-items: center;
    gap: 0.25rem;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .range-weekday {
    color: var(--dk-range-weekday-color);
    font-size: var(--dk-range-weekday-size);
    padding: 0.25rem 0;
    text-align: center;
  }

  .range-nav,
  .range-day {
    align-items: center;
    appearance: none;
    border: 0;
    display: inline-flex;
    justify-content: center;
  }

  .range-nav {
    background: var(--dk-range-nav-bg);
    border-radius: 999px;
    color: var(--dk-range-nav-fg);
    inline-size: var(--dk-range-nav-size);
    min-block-size: var(--dk-range-nav-size);
  }

  .range-day {
    background: var(--dk-range-day-bg);
    border-radius: var(--dk-range-day-radius);
    color: var(--dk-range-day-fg);
    font-size: var(--dk-range-day-size);
    min-block-size: var(--dk-range-day-target);
  }

  .range-day[data-in-range='true'] {
    background: var(--dk-range-day-between-bg);
    color: var(--dk-range-day-between-fg);
  }

  .range-day[data-selected='true'] {
    background: var(--dk-range-day-selected-bg);
    color: var(--dk-range-day-selected-fg);
  }

  .range-day[data-outside='true'] {
    color: var(--dk-range-day-outside-fg);
  }

  .range-day:disabled {
    color: var(--dk-range-day-disabled-fg);
    cursor: not-allowed;
  }

  .range-day[data-today='true'] {
    outline: 1px solid currentColor;
    outline-offset: -2px;
  }

  @media (max-width: 720px) {
    .range-months {
      grid-template-columns: 1fr;
    }
  }
</style>
