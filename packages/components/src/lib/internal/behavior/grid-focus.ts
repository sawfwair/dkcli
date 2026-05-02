export type GridCell = {
  row: number;
  col: number;
};

export function moveGridCell(
  current: GridCell,
  key: string,
  rowCount: number,
  colCount: number
): GridCell {
  switch (key) {
    case 'ArrowLeft':
      return { row: current.row, col: Math.max(0, current.col - 1) };
    case 'ArrowRight':
      return { row: current.row, col: Math.min(colCount - 1, current.col + 1) };
    case 'ArrowUp':
      return { row: Math.max(0, current.row - 1), col: current.col };
    case 'ArrowDown':
      return { row: Math.min(rowCount - 1, current.row + 1), col: current.col };
    case 'Home':
      return { row: current.row, col: 0 };
    case 'End':
      return { row: current.row, col: Math.max(0, colCount - 1) };
    default:
      return current;
  }
}
