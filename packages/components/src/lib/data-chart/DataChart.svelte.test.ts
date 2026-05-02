import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import DataChart from './DataChart.svelte';

describe('DataChart', () => {
  it('renders legend items and a tooltip for hovered data', async () => {
    render(DataChart, {
      props: {
        title: 'Revenue',
        type: 'line',
        categories: ['Jan', 'Feb', 'Mar'],
        series: [{ id: 'mrr', label: 'MRR', values: [12, 18, 24] }]
      }
    });

    expect(screen.getByText('MRR')).toBeTruthy();

    const point = document.querySelector('circle') as SVGCircleElement;
    await fireEvent.mouseEnter(point);

    const tooltip = document.querySelector('.chart-tooltip') as HTMLElement;
    expect(within(tooltip).getByText('Jan')).toBeTruthy();
    expect(within(tooltip).getByText('12')).toBeTruthy();
  });

  it('renders the empty state when series are missing', () => {
    render(DataChart, {
      props: {
        title: 'Revenue',
        categories: [],
        series: []
      }
    });

    expect(screen.getByText('No chart data yet')).toBeTruthy();
  });
});
