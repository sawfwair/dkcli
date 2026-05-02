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
export declare function chartMaxValue(series: ChartSeriesInput[]): number;
export declare function buildChartPoints(input: {
    values: number[];
    width: number;
    height: number;
    padding: number;
    max: number;
}): ChartPoint[];
export declare function linePath(points: ChartPoint[]): string;
export declare function areaPath(points: ChartPoint[], height: number, padding: number): string;
