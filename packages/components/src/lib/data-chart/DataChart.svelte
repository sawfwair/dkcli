<script context="module" lang="ts">
  export type DataChartSeries = {
    id: string;
    label: string;
    values: number[];
    tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  };
</script>

<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import {
    areaPath,
    buildChartPoints,
    chartMaxValue,
    linePath,
    type ChartPoint
  } from '../internal/behavior/index.js';
  import {
    DEFAULT_DATA_CHART_THEME,
    createDataChartRegistration,
    getDataChartRecipeCase,
    serializeDataChartSlotStyles
  } from './data-chart.recipe.js';
  import type { DataChartType } from './data-chart.spec.js';

  type TooltipState = {
    label: string;
    value: number;
    seriesLabel: string;
    x: number;
    y: number;
  };

  export let type: DataChartType = 'line';
  export let series: DataChartSeries[] = [];
  export let categories: string[] = [];
  export let title = 'Chart';
  export let description: string | undefined = undefined;
  export let height = 280;
  export let showLegend = true;
  export let showGrid = true;
  export let showTooltip = true;
  export let valueFormat: ((value: number) => string) | undefined = undefined;
  export let emptyTitle = 'No chart data yet';
  export let emptyDescription = 'Add one or more series to render the chart.';
  export let theme: ThemeContract = DEFAULT_DATA_CHART_THEME;

  const defaultRegistration = createDataChartRegistration(DEFAULT_DATA_CHART_THEME);
  const width = 640;
  const padding = 40;

  let registration = defaultRegistration;
  let compiledCase = getDataChartRecipeCase(defaultRegistration.recipe, { type });
  let slotStyles = serializeDataChartSlotStyles(compiledCase);
  let tooltip: TooltipState | null = null;

  $: registration =
    theme.name === DEFAULT_DATA_CHART_THEME.name
      ? defaultRegistration
      : createDataChartRegistration(theme);
  $: compiledCase = getDataChartRecipeCase(registration.recipe, { type });
  $: slotStyles = serializeDataChartSlotStyles(compiledCase);
  $: maxValue = chartMaxValue(series);
  $: chartSeries = series.map((entry) => ({
    ...entry,
    tone: entry.tone ?? 'brand',
    points: buildChartPoints({
      values: entry.values,
      width,
      height,
      padding,
      max: maxValue
    })
  }));
  $: barWidth = Math.max(
    16,
    ((width - padding * 2) / Math.max(1, categories.length)) / Math.max(1, series.length) - 6
  );

  function toneVar(tone: DataChartSeries['tone']): string {
    return `var(--dk-chart-${tone ?? 'brand'})`;
  }

  function formatValue(value: number): string {
    return valueFormat ? valueFormat(value) : value.toLocaleString();
  }

  function showPointTooltip(point: ChartPoint, seriesLabel: string): void {
    const label = categories[point.index] ?? `Point ${point.index + 1}`;
    tooltip = {
      label,
      value: point.value,
      seriesLabel,
      x: point.x,
      y: point.y
    };
  }
</script>

<figure class="data-chart" style={slotStyles.root}>
  <figcaption class="chart-copy">
    <h3 class="chart-title" style={slotStyles.title}>{title}</h3>
    {#if description}
      <p class="chart-description" style={slotStyles.description}>{description}</p>
    {/if}
  </figcaption>

  <div class="chart-surface" style={slotStyles.surface}>
    {#if series.length === 0 || categories.length === 0}
      <div class="chart-empty" style={slotStyles.empty}>
        <strong>{emptyTitle}</strong>
        <p>{emptyDescription}</p>
      </div>
    {:else}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} class="chart-svg">
        {#if showGrid}
          {#each [0, 0.25, 0.5, 0.75, 1] as stop}
            <line
              x1={padding}
              x2={width - padding}
              y1={padding + (height - padding * 2) * stop}
              y2={padding + (height - padding * 2) * stop}
              stroke="var(--dk-chart-grid)"
              stroke-dasharray="3 5"
            />
          {/each}
        {/if}

        {#each categories as category, index}
          <text
            x={padding + ((width - padding * 2) / Math.max(1, categories.length - 1 || 1)) * index}
            y={height - 10}
            text-anchor="middle"
            fill="var(--dk-chart-axis)"
            font-size="var(--dk-chart-axis-size)"
          >
            {category}
          </text>
        {/each}

        {#each chartSeries as chartEntry}
          {#if type === 'area'}
            <path
              d={areaPath(chartEntry.points, height, padding)}
              fill={toneVar(chartEntry.tone)}
              opacity="0.18"
            />
          {/if}

          {#if type === 'line' || type === 'area'}
            <path d={linePath(chartEntry.points)} fill="none" stroke={toneVar(chartEntry.tone)} stroke-width="3" />
            {#if showTooltip}
              {#each chartEntry.points as point (chartEntry.id + '-' + point.index)}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={toneVar(chartEntry.tone)}
                  role="button"
                  aria-label={`${chartEntry.label} ${categories[point.index] ?? point.index + 1}: ${formatValue(point.value)}`}
                  tabindex="0"
                  onmouseenter={() => showPointTooltip(point, chartEntry.label)}
                  onfocus={() => showPointTooltip(point, chartEntry.label)}
                  onmouseleave={() => (tooltip = null)}
                  onblur={() => (tooltip = null)}
                />
              {/each}
            {/if}
          {:else}
            {#each chartEntry.points as point, index (chartEntry.id + '-' + point.index)}
              <rect
                x={point.x - ((chartEntry.points.length > 1 ? (width - padding * 2) / Math.max(1, categories.length) : barWidth) / 2) + series.findIndex((entry) => entry.id === chartEntry.id) * (barWidth + 4)}
                y={point.y}
                width={barWidth}
                height={height - padding - point.y}
                rx="6"
                fill={toneVar(chartEntry.tone)}
                role="button"
                tabindex={showTooltip ? 0 : -1}
                onmouseenter={() => showPointTooltip(point, chartEntry.label)}
                onfocus={() => showPointTooltip(point, chartEntry.label)}
                onmouseleave={() => (tooltip = null)}
                onblur={() => (tooltip = null)}
                aria-label={`${chartEntry.label} ${categories[index] ?? index + 1}: ${formatValue(point.value)}`}
              />
            {/each}
          {/if}
        {/each}
      </svg>

      {#if showLegend}
        <div class="chart-legend" style={slotStyles.legend}>
          {#each chartSeries as entry (entry.id)}
            <span class="chart-legend-item">
              <span class="chart-swatch" style={`background:${toneVar(entry.tone)};`}></span>
              <span>{entry.label}</span>
            </span>
          {/each}
        </div>
      {/if}

      {#if showTooltip && tooltip}
        <div class="chart-tooltip" style={slotStyles.tooltip}>
          <strong>{tooltip.seriesLabel}</strong>
          <span>{tooltip.label}</span>
          <span>{formatValue(tooltip.value)}</span>
        </div>
      {/if}
    {/if}
  </div>
</figure>

<style>
  .data-chart,
  .chart-copy,
  .chart-surface,
  .chart-empty {
    display: grid;
  }

  .data-chart {
    gap: var(--dk-chart-gap);
  }

  .chart-copy,
  .chart-empty {
    gap: 0.35rem;
  }

  .chart-title,
  .chart-description,
  .chart-empty p {
    margin: 0;
  }

  .chart-title {
    font-size: var(--dk-chart-title-size);
    font-weight: var(--dk-chart-title-weight);
  }

  .chart-description {
    font-size: var(--dk-chart-description-size);
  }

  .chart-surface {
    background: var(--dk-chart-surface-bg);
    border: 1px solid var(--dk-chart-surface-border);
    border-radius: var(--dk-chart-surface-radius);
    color: var(--dk-chart-surface-fg);
    gap: 0.75rem;
    padding: var(--dk-chart-surface-padding);
    position: relative;
  }

  .chart-svg {
    height: auto;
    width: 100%;
  }

  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    font-size: var(--dk-chart-legend-size);
  }

  .chart-legend-item {
    align-items: center;
    display: inline-flex;
    gap: 0.45rem;
  }

  .chart-swatch {
    block-size: 0.7rem;
    border-radius: 999px;
    inline-size: 0.7rem;
  }

  .chart-tooltip {
    background: var(--dk-chart-tooltip-bg);
    border: 1px solid var(--dk-chart-tooltip-border);
    border-radius: var(--dk-chart-tooltip-radius);
    color: var(--dk-chart-tooltip-fg);
    display: grid;
    gap: 0.15rem;
    justify-self: end;
    padding: 0.6rem 0.75rem;
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
</style>
