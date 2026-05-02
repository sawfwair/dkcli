export type GridCell = {
    row: number;
    col: number;
};
export declare function moveGridCell(current: GridCell, key: string, rowCount: number, colCount: number): GridCell;
