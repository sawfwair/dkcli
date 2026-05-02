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
export declare function formatDateIso(parts: CalendarParts): string;
export declare function parseDateIso(value: string | undefined): CalendarParts | null;
export declare function todayIso(): string;
export declare function monthStartIso(value: string | undefined): string;
export declare function formatDateLabel(value: string | undefined, fallback?: string): string;
export declare function addDays(value: string, delta: number): string;
export declare function addMonths(value: string, delta: number): string;
export declare function moveDateWithinGrid(value: string, key: string, weekStartsOn: 0 | 1): string;
export declare function isDateDisabled(input: {
    value: string;
    min?: string;
    max?: string;
    disabledDates?: Iterable<string>;
}): boolean;
export declare function buildCalendarMonth(input: {
    visibleMonth: string;
    value?: string;
    min?: string;
    max?: string;
    disabledDates?: string[];
    focusedDate?: string;
    weekStartsOn?: 0 | 1;
}): CalendarMonth;
export {};
