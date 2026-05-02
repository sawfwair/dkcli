import { type CalendarMonth, type CalendarDay } from './calendar-grid.js';
export type DateRangeValue = {
    start?: string;
    end?: string;
};
export type RangeCalendarPair = {
    months: [CalendarMonth, CalendarMonth];
};
export declare function normalizeRange(range: DateRangeValue | undefined): DateRangeValue;
export declare function selectRangeValue(current: DateRangeValue | undefined, nextDate: string): DateRangeValue;
export declare function isRangeComplete(range: DateRangeValue | undefined): boolean;
export declare function isDateWithinRange(date: string, range: DateRangeValue | undefined): boolean;
export declare function isRangeEdge(date: string, range: DateRangeValue | undefined): boolean;
export declare function buildRangeCalendarPair(input: {
    visibleMonth: string;
    value?: DateRangeValue;
    min?: string;
    max?: string;
    disabledDates?: string[];
    focusedDate?: string;
    weekStartsOn?: 0 | 1;
}): RangeCalendarPair;
export declare function decorateRangeDay(day: CalendarDay, range: DateRangeValue | undefined): CalendarDay & {
    inRange: boolean;
    edge: boolean;
};
