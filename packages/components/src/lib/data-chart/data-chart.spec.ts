import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type DataChartType = 'line' | 'bar' | 'area';

export const dataChartSpec: ComponentSpec = createComponentSpec({
  id: 'data-chart',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'title', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'axis', kind: 'text', role: 'meta' },
    { name: 'legend', kind: 'text', role: 'meta' },
    { name: 'tooltip', kind: 'container' },
    { name: 'empty', kind: 'text', role: 'support' }
  ],
  axes: [{ name: 'type', values: ['line', 'bar', 'area'], default: 'line' }],
  states: ['rest', 'hover', 'focus-visible', 'selected'],
  recipe: {
    root: [
      {
        style: {
          '--dk-chart-gap': literal('0.75rem')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-chart-surface-bg': alias('chart-surface-bg'),
          '--dk-chart-surface-fg': alias('chart-surface-fg'),
          '--dk-chart-surface-border': alias('display-card-border'),
          '--dk-chart-surface-radius': alias('control-radius'),
          '--dk-chart-surface-padding': literal('1rem'),
          '--dk-chart-grid': alias('chart-grid'),
          '--dk-chart-axis': alias('chart-axis'),
          '--dk-chart-brand': alias('chart-brand'),
          '--dk-chart-success': alias('chart-success'),
          '--dk-chart-warning': alias('chart-warning'),
          '--dk-chart-danger': alias('chart-danger'),
          '--dk-chart-neutral': alias('chart-neutral')
        }
      }
    ],
    title: [
      {
        style: {
          '--dk-chart-title-size': literal('1rem'),
          '--dk-chart-title-weight': literal('650')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-chart-description-size': literal('0.875rem')
        }
      }
    ],
    axis: [
      {
        style: {
          '--dk-chart-axis-size': literal('0.75rem')
        }
      }
    ],
    legend: [
      {
        style: {
          '--dk-chart-legend-size': literal('0.8rem')
        }
      }
    ],
    tooltip: [
      {
        style: {
          '--dk-chart-tooltip-bg': alias('floating-bg'),
          '--dk-chart-tooltip-fg': alias('floating-fg'),
          '--dk-chart-tooltip-border': alias('floating-border'),
          '--dk-chart-tooltip-radius': alias('overlay-radius')
        }
      }
    ],
    empty: [
      {
        style: {
          '--dk-chart-empty-size': literal('0.9rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'title',
        foreground: slotVar('surface', '--dk-chart-surface-fg'),
        background: slotVar('surface', '--dk-chart-surface-bg'),
        fontSize: slotVar('title', '--dk-chart-title-size'),
        fontWeight: 650
      }
    ],
    layout: {
      target: 'surface',
      widths: [320, 640],
      heights: [240, 320],
      noOverflow: true,
      blockSize: literal('280px')
    }
  },
  proofCases: [
    { name: 'line', axes: { type: 'line' } },
    { name: 'bar', axes: { type: 'bar' } },
    { name: 'area', axes: { type: 'area' } }
  ],
  a11y: {
    role: 'img',
    keyboardModel: 'point-tooltip',
    labelling: 'aria-label'
  }
});
