export type CalendarDay = {
  iso: string;
  day: number;
  outsideMonth: boolean;
  disabled: boolean;
  selected: boolean;
  today: boolean;
  focused: boolean;
};

export type CalendarWeek = {
  index: number;
  days: CalendarDay[];
};

export type CalendarMonth = {
  monthLabel: string;
  weekdayLabels: string[];
  weeks: CalendarWeek[];
  visibleMonth: string;
};

type CalendarParts = {
  year: number;
  month: number;
  day: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDate(parts: CalendarParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function fromUtcDate(date: Date): CalendarParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateIso(parts: CalendarParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function parseDateIso(value: string | undefined): CalendarParts | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
  const date = toUtcDate(parts);
  const normalized = fromUtcDate(date);
  if (
    normalized.year !== parts.year ||
    normalized.month !== parts.month ||
    normalized.day !== parts.day
  ) {
    return null;
  }
  return parts;
}

export function todayIso(): string {
  const now = new Date();
  return formatDateIso({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  });
}

export function monthStartIso(value: string | undefined): string {
  const parsed = parseDateIso(value) ?? parseDateIso(todayIso());
  return `${parsed!.year}-${pad(parsed!.month)}-01`;
}

export function formatDateLabel(value: string | undefined, fallback = ''): string {
  const parsed = parseDateIso(value);
  if (!parsed) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(toUtcDate(parsed));
}

export function addDays(value: string, delta: number): string {
  const parsed = parseDateIso(value);
  if (!parsed) {
    return value;
  }
  const next = new Date(toUtcDate(parsed).getTime() + delta * DAY_MS);
  return formatDateIso(fromUtcDate(next));
}

export function addMonths(value: string, delta: number): string {
  const parsed = parseDateIso(value);
  if (!parsed) {
    return value;
  }

  const date = toUtcDate(parsed);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return formatDateIso(fromUtcDate(date));
}

export function moveDateWithinGrid(
  value: string,
  key: string,
  weekStartsOn: 0 | 1
): string {
  const parsed = parseDateIso(value);
  if (!parsed) {
    return value;
  }

  const date = toUtcDate(parsed);
  const weekday = (date.getUTCDay() - weekStartsOn + 7) % 7;

  switch (key) {
    case 'ArrowLeft':
      return addDays(value, -1);
    case 'ArrowRight':
      return addDays(value, 1);
    case 'ArrowUp':
      return addDays(value, -7);
    case 'ArrowDown':
      return addDays(value, 7);
    case 'Home':
      return addDays(value, -weekday);
    case 'End':
      return addDays(value, 6 - weekday);
    case 'PageUp':
      return addMonths(value, -1);
    case 'PageDown':
      return addMonths(value, 1);
    default:
      return value;
  }
}

export function isDateDisabled(input: {
  value: string;
  min?: string;
  max?: string;
  disabledDates?: Iterable<string>;
}): boolean {
  const { value, min, max, disabledDates } = input;

  if (min && value < min) {
    return true;
  }
  if (max && value > max) {
    return true;
  }
  if (disabledDates && new Set(disabledDates).has(value)) {
    return true;
  }
  return false;
}

export function buildCalendarMonth(input: {
  visibleMonth: string;
  value?: string;
  min?: string;
  max?: string;
  disabledDates?: string[];
  focusedDate?: string;
  weekStartsOn?: 0 | 1;
}): CalendarMonth {
  const weekStartsOn = input.weekStartsOn ?? 0;
  const visible = parseDateIso(input.visibleMonth) ?? parseDateIso(monthStartIso(undefined));
  const visibleMonth = monthStartIso(formatDateIso(visible!));
  const selectedValue = input.value;
  const today = todayIso();
  const focused = input.focusedDate ?? selectedValue ?? today;
  const monthStart = toUtcDate({ year: visible!.year, month: visible!.month, day: 1 });
  const monthWeekday = (monthStart.getUTCDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(monthStart.getTime() - monthWeekday * DAY_MS);
  const disabledSet = new Set(input.disabledDates ?? []);

  const weeks: CalendarWeek[] = [];
  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const days: CalendarDay[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(gridStart.getTime() + (weekIndex * 7 + dayIndex) * DAY_MS);
      const iso = formatDateIso(fromUtcDate(date));
      const parts = fromUtcDate(date);
      days.push({
        iso,
        day: parts.day,
        outsideMonth: parts.month !== visible!.month,
        disabled: isDateDisabled({
          value: iso,
          min: input.min,
          max: input.max,
          disabledDates: disabledSet
        }),
        selected: selectedValue === iso,
        today: iso === today,
        focused: iso === focused
      });
    }
    weeks.push({ index: weekIndex, days });
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(Date.UTC(2024, 0, 7 + ((index + weekStartsOn) % 7)));
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      timeZone: 'UTC'
    }).format(day);
  });

  return {
    monthLabel: new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(monthStart),
    weekdayLabels,
    weeks,
    visibleMonth
  };
}
