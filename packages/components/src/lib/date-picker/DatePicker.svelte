<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { ThemeContract } from '@dkcli/core';

  import {
    addMonths,
    buildCalendarMonth,
    computeAnchoredPosition,
    formatDateLabel,
    isDateDisabled,
    isEventOutside,
    monthStartIso,
    moveDateWithinGrid,
    todayIso,
    type Placement
  } from '../internal/behavior/index.js';
  import { FieldFrame } from '../primitives/index.js';
  import {
    DEFAULT_DATE_PICKER_THEME,
    createDatePickerRegistration,
    getDatePickerRecipeCase,
    serializeDatePickerSlotStyles
  } from './date-picker.recipe.js';
  import type { DatePickerSize } from './date-picker.spec.js';

  const dispatch = createEventDispatcher<{ change: { value: string | undefined } }>();

  let nextId = 0;

  export let value: string | undefined = undefined;
  export let label: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let placeholder = 'Select a date';
  export let required = false;
  export let disabled = false;
  export let name: string | undefined = undefined;
  export let id: string | undefined = undefined;
  export let size: DatePickerSize = 'md';
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;
  export let disabledDates: string[] = [];
  export let weekStartsOn: 0 | 1 = 0;
  export let theme: ThemeContract = DEFAULT_DATE_PICKER_THEME;
  export let onChange: ((detail: { value: string | undefined }) => void) | undefined = undefined;

  const defaultRegistration = createDatePickerRegistration(DEFAULT_DATE_PICKER_THEME);
  const localId = `dk-date-picker-${++nextId}`;

  let registration = defaultRegistration;
  let fieldId = id ?? localId;
  let currentValue = value;
  let previousValue = value;
  let invalid = Boolean(error);
  let internalOpen = false;
  let visibleMonth = monthStartIso(value);
  let focusedDate = value ?? todayIso();
  let triggerEl: HTMLButtonElement | null = null;
  let surfaceEl: HTMLDivElement | null = null;
  let dayRefs: Record<string, HTMLButtonElement | undefined> = {};
  let position = { left: 0, top: 0, placement: 'bottom' as Placement };
  let compiledCase = getDatePickerRecipeCase(defaultRegistration.recipe, { size });
  let slotStyles = serializeDatePickerSlotStyles(compiledCase);

  $: registration =
    theme.name === DEFAULT_DATE_PICKER_THEME.name
      ? defaultRegistration
      : createDatePickerRegistration(theme);
  $: fieldId = id ?? localId;
  $: if (value !== previousValue) {
    currentValue = value;
    previousValue = value;
    if (value) {
      visibleMonth = monthStartIso(value);
      focusedDate = value;
    }
  }
  $: invalid = Boolean(error);
  $: compiledCase = getDatePickerRecipeCase(registration.recipe, { size });
  $: slotStyles = serializeDatePickerSlotStyles(compiledCase);
  $: describedBy = error ? `${fieldId}-error` : description ? `${fieldId}-description` : undefined;
  $: calendar = buildCalendarMonth({
    visibleMonth,
    value: currentValue,
    min,
    max,
    disabledDates,
    focusedDate,
    weekStartsOn
  });
  $: if (internalOpen) {
    void syncPositionAndFocus();
  }

  function registerDay(node: HTMLButtonElement, iso: string) {
    dayRefs[iso] = node;
    return {
      destroy() {
        delete dayRefs[iso];
      }
    };
  }

  async function syncPositionAndFocus(): Promise<void> {
    await tick();
    if (!triggerEl || !surfaceEl || typeof window === 'undefined') {
      return;
    }

    const anchor = triggerEl.getBoundingClientRect();
    const surface = surfaceEl.getBoundingClientRect();
    position = computeAnchoredPosition({
      anchor,
      surface: { width: surface.width || 320, height: surface.height || 324 },
      placement: 'bottom',
      offset: 8,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    dayRefs[focusedDate]?.focus();
  }

  function openCalendar(): void {
    if (disabled) {
      return;
    }
    internalOpen = true;
    focusedDate = currentValue ?? focusedDate ?? todayIso();
    visibleMonth = monthStartIso(focusedDate);
  }

  function closeCalendar(): void {
    internalOpen = false;
    void tick().then(() => {
      triggerEl?.focus();
    });
  }

  function emitChange(nextValue: string | undefined): void {
    currentValue = nextValue;
    value = nextValue;
    onChange?.({ value: nextValue });
    dispatch('change', { value: nextValue });
  }

  function chooseDate(nextValue: string): void {
    if (
      isDateDisabled({
        value: nextValue,
        min,
        max,
        disabledDates
      })
    ) {
      return;
    }

    focusedDate = nextValue;
    visibleMonth = monthStartIso(nextValue);
    emitChange(nextValue);
    internalOpen = false;
  }

  function moveMonth(delta: number): void {
    visibleMonth = monthStartIso(addMonths(visibleMonth, delta));
    focusedDate = addMonths(focusedDate, delta);
    void syncPositionAndFocus();
  }

  function handleWindowClick(event: MouseEvent): void {
    if (!internalOpen) {
      return;
    }
    if (isEventOutside(surfaceEl, event.target) && isEventOutside(triggerEl, event.target)) {
      closeCalendar();
    }
  }

  function handleTriggerKeydown(event: KeyboardEvent): void {
    if (disabled) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      openCalendar();
      event.preventDefault();
    }
  }

  function handleDayKeydown(event: KeyboardEvent, dateIso: string): void {
    if (event.key === 'Escape') {
      closeCalendar();
      triggerEl?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      chooseDate(dateIso);
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
      focusedDate = moveDateWithinGrid(dateIso, event.key, weekStartsOn);
      visibleMonth = monthStartIso(focusedDate);
      event.preventDefault();
      void syncPositionAndFocus();
    }
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
  <input type="hidden" {name} value={currentValue ?? ''} />

  <button
    bind:this={triggerEl}
    class="date-picker-trigger"
    style={`${slotStyles.trigger} ${slotStyles.icon}`}
    type="button"
    aria-haspopup="dialog"
    aria-expanded={internalOpen ? 'true' : 'false'}
    aria-controls={`${fieldId}-dialog`}
    aria-describedby={describedBy}
    data-invalid={invalid}
    {disabled}
    onclick={() => (internalOpen ? closeCalendar() : openCalendar())}
    onkeydown={handleTriggerKeydown}
  >
    <span class:selected={!currentValue}>
      {formatDateLabel(currentValue, placeholder)}
    </span>
    <span class="date-picker-icon" aria-hidden="true">◷</span>
  </button>
</FieldFrame>

{#if internalOpen}
  <div
    bind:this={surfaceEl}
    class="date-picker-surface"
    style={`${slotStyles.surface}; left:${position.left}px; top:${position.top}px;`}
    id={`${fieldId}-dialog`}
    role="dialog"
    aria-label="Choose date"
  >
    <div class="calendar-header">
      <button
        class="calendar-nav"
        style={slotStyles.navButton}
        type="button"
        aria-label="Previous month"
        onclick={() => moveMonth(-1)}
      >
        ‹
      </button>
      <div class="calendar-caption" style={slotStyles.caption}>{calendar.monthLabel}</div>
      <button
        class="calendar-nav"
        style={slotStyles.navButton}
        type="button"
        aria-label="Next month"
        onclick={() => moveMonth(1)}
      >
        ›
      </button>
    </div>

    <div class="calendar-grid" role="grid" aria-label={calendar.monthLabel}>
      {#each calendar.weekdayLabels as weekday (weekday)}
        <span class="weekday" role="columnheader" style={slotStyles.weekday}>{weekday}</span>
      {/each}

      {#each calendar.weeks as week (week.index)}
        {#each week.days as day (day.iso)}
          <button
            use:registerDay={day.iso}
            class="day"
            style={slotStyles.day}
            type="button"
            aria-label={formatDateLabel(day.iso)}
            aria-current={day.today ? 'date' : undefined}
            aria-pressed={day.selected ? 'true' : 'false'}
            data-selected={day.selected}
            data-disabled={day.disabled}
            data-outside={day.outsideMonth}
            data-today={day.today}
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
  </div>
{/if}

<style>
  .date-picker-trigger {
    align-items: center;
    appearance: none;
    background: var(--dk-date-picker-trigger-bg);
    border: 1px solid var(--dk-date-picker-trigger-border);
    border-radius: var(--dk-date-picker-trigger-radius);
    color: var(--dk-date-picker-trigger-fg);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    min-block-size: var(--dk-date-picker-trigger-block-size);
    padding: 0 var(--dk-date-picker-trigger-inline-padding);
    width: 100%;
  }

  .date-picker-trigger:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-date-picker-trigger-border) 24%, transparent);
    outline-offset: 2px;
  }

  .date-picker-trigger .selected {
    color: color-mix(in srgb, var(--dk-date-picker-trigger-fg) 64%, transparent);
  }

  .date-picker-icon {
    color: var(--dk-date-picker-icon-color);
    font-size: var(--dk-date-picker-icon-size);
  }

  .date-picker-surface {
    background: var(--dk-date-picker-surface-bg);
    border: 1px solid var(--dk-date-picker-surface-border);
    border-radius: var(--dk-date-picker-surface-radius);
    box-shadow: var(--dk-date-picker-surface-shadow);
    color: var(--dk-date-picker-surface-fg);
    inline-size: min(var(--dk-date-picker-surface-width), calc(100vw - 2rem));
    padding: var(--dk-date-picker-surface-padding);
    position: fixed;
    z-index: 45;
  }

  .calendar-header {
    align-items: center;
    display: grid;
    gap: 0.75rem;
    grid-template-columns: auto 1fr auto;
    margin-bottom: 0.75rem;
  }

  .calendar-caption {
    color: var(--dk-date-picker-caption-color);
    font-size: var(--dk-date-picker-caption-size);
    font-weight: var(--dk-date-picker-caption-weight);
    text-align: center;
  }

  .calendar-nav {
    align-items: center;
    background: var(--dk-date-picker-nav-bg);
    border: 0;
    border-radius: 999px;
    color: var(--dk-date-picker-nav-fg);
    cursor: pointer;
    display: inline-flex;
    font-size: 1.1rem;
    inline-size: var(--dk-date-picker-nav-size);
    justify-content: center;
    min-block-size: var(--dk-date-picker-nav-size);
    padding: 0;
  }

  .calendar-nav:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-date-picker-nav-fg) 24%, transparent);
    outline-offset: 2px;
  }

  .calendar-grid {
    display: grid;
    gap: 0.25rem;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .weekday {
    color: var(--dk-date-picker-weekday-color);
    font-size: var(--dk-date-picker-weekday-size);
    padding-block: 0.2rem 0.35rem;
    text-align: center;
  }

  .day {
    align-items: center;
    background: var(--dk-date-picker-day-bg);
    border: 0;
    border-radius: var(--dk-date-picker-day-radius);
    color: var(--dk-date-picker-day-fg);
    cursor: pointer;
    display: inline-flex;
    font-size: var(--dk-date-picker-day-size);
    justify-content: center;
    min-block-size: var(--dk-date-picker-day-target);
    min-inline-size: var(--dk-date-picker-day-target);
    padding: 0;
  }

  .day[data-selected='true'] {
    background: var(--dk-date-picker-day-bg-selected, var(--dk-date-picker-day-bg));
    color: var(--dk-date-picker-day-fg-selected, var(--dk-date-picker-day-fg));
  }

  .day[data-outside='true'] {
    color: var(--dk-date-picker-day-outside-fg);
  }

  .day[data-disabled='true'] {
    color: var(--dk-date-picker-day-disabled-fg);
    cursor: not-allowed;
  }

  .day[data-today='true'] {
    box-shadow: inset 0 0 0 1px var(--dk-date-picker-day-today-ring);
  }

  .day:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--dk-date-picker-day-today-ring) 30%, transparent);
    outline-offset: 2px;
  }
</style>
