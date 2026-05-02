import {
  addMonths,
  buildCalendarMonth,
  type CalendarMonth,
  monthStartIso,
  type CalendarDay
} from './calendar-grid.js';

export type DateRangeValue = {
  start?: string;
  end?: string;
};

export type RangeCalendarPair = {
  months: [CalendarMonth, CalendarMonth];
};

export function normalizeRange(range: DateRangeValue | undefined): DateRangeValue {
  if (!range?.start || !range?.end) {
    return range ?? {};
  }

  if (range.start <= range.end) {
    return range;
  }

  return { start: range.end, end: range.start };
}

export function selectRangeValue(
  current: DateRangeValue | undefined,
  nextDate: string
): DateRangeValue {
  const normalized = normalizeRange(current);

  if (!normalized.start || (normalized.start && normalized.end)) {
    return { start: nextDate, end: undefined };
  }

  if (nextDate < normalized.start) {
    return { start: nextDate, end: normalized.start };
  }

  return { start: normalized.start, end: nextDate };
}

export function isRangeComplete(range: DateRangeValue | undefined): boolean {
  return Boolean(range?.start && range?.end);
}

export function isDateWithinRange(date: string, range: DateRangeValue | undefined): boolean {
  const normalized = normalizeRange(range);
  if (!normalized.start || !normalized.end) {
    return false;
  }
  return date >= normalized.start && date <= normalized.end;
}

export function isRangeEdge(date: string, range: DateRangeValue | undefined): boolean {
  return date === range?.start || date === range?.end;
}

export function buildRangeCalendarPair(input: {
  visibleMonth: string;
  value?: DateRangeValue;
  min?: string;
  max?: string;
  disabledDates?: string[];
  focusedDate?: string;
  weekStartsOn?: 0 | 1;
}): RangeCalendarPair {
  const visibleMonth = monthStartIso(input.visibleMonth);
  const nextMonth = monthStartIso(addMonths(visibleMonth, 1));

  return {
    months: [
      buildCalendarMonth({
        visibleMonth,
        value: input.value?.start,
        min: input.min,
        max: input.max,
        disabledDates: input.disabledDates,
        focusedDate: input.focusedDate,
        weekStartsOn: input.weekStartsOn
      }),
      buildCalendarMonth({
        visibleMonth: nextMonth,
        value: input.value?.end,
        min: input.min,
        max: input.max,
        disabledDates: input.disabledDates,
        focusedDate: input.focusedDate,
        weekStartsOn: input.weekStartsOn
      })
    ]
  };
}

export function decorateRangeDay(
  day: CalendarDay,
  range: DateRangeValue | undefined
): CalendarDay & { inRange: boolean; edge: boolean } {
  return {
    ...day,
    inRange: isDateWithinRange(day.iso, range),
    edge: isRangeEdge(day.iso, range)
  };
}
