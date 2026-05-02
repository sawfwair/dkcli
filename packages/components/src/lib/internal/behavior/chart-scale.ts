export type ChartSeriesInput = {
  id: string;
  label: string;
  values: number[];
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
};

export type ChartPoint = {
  x: number;
  y: number;
  value: number;
  index: number;
};

export function chartMaxValue(series: ChartSeriesInput[]): number {
  const values = series.flatMap((entry) => entry.values);
  return Math.max(1, ...values, 0);
}

export function buildChartPoints(input: {
  values: number[];
  width: number;
  height: number;
  padding: number;
  max: number;
}): ChartPoint[] {
  const count = Math.max(1, input.values.length - 1);
  const innerWidth = Math.max(1, input.width - input.padding * 2);
  const innerHeight = Math.max(1, input.height - input.padding * 2);

  return input.values.map((value, index) => ({
    index,
    value,
    x: input.padding + (innerWidth / count) * index,
    y: input.padding + innerHeight - (value / input.max) * innerHeight
  }));
}

export function linePath(points: ChartPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

export function areaPath(points: ChartPoint[], height: number, padding: number): string {
  if (points.length === 0) {
    return '';
  }

  const baseline = height - padding;
  return `${linePath(points)} L ${points[points.length - 1].x.toFixed(2)} ${baseline.toFixed(2)} L ${
    points[0].x.toFixed(2)
  } ${baseline.toFixed(2)} Z`;
}
