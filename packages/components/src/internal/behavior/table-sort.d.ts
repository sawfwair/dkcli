export type TableSortDirection = 'asc' | 'desc';
export type TableSortColumn<Row extends {
    id: string;
} & Record<string, unknown>> = {
    key: string;
    accessor?: string | ((row: Row) => string | number | null | undefined);
    format?: (value: unknown, row: Row) => string;
};
export declare function resolveTableValue<Row extends {
    id: string;
} & Record<string, unknown>>(row: Row, column: TableSortColumn<Row>): unknown;
export declare function formatTableValue<Row extends {
    id: string;
} & Record<string, unknown>>(row: Row, column: TableSortColumn<Row>): string;
export declare function sortTableRows<Row extends {
    id: string;
} & Record<string, unknown>>(rows: Row[], columns: TableSortColumn<Row>[], sortBy: string | undefined, direction: TableSortDirection): Row[];
export declare function toggleSortDirection(input: {
    currentSortBy?: string;
    currentDirection?: TableSortDirection;
    nextColumn: string;
}): {
    sortBy: string;
    sortDirection: TableSortDirection;
};
export declare function toggleSelection(ids: string[], rowId: string): string[];
export declare function toggleAllSelection(current: string[], allIds: string[]): string[];
