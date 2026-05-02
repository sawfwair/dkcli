import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type ProgressTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type ProgressSize = 'sm' | 'md';

export const progressSpec: ComponentSpec = createComponentSpec({
  id: 'progress',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'header', kind: 'container' },
    { name: 'label', kind: 'text', role: 'body' },
    { name: 'value', kind: 'text', role: 'meta' },
    { name: 'track', kind: 'container', required: true },
    { name: 'indicator', kind: 'control', required: true }
  ],
  axes: [
    { name: 'tone', values: ['neutral', 'brand', 'success', 'warning', 'danger'], default: 'brand' },
    { name: 'size', values: ['sm', 'md'], default: 'md' }
  ],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-progress-gap': ref('space.xs')
        }
      }
    ],
    header: [
      {
        style: {
          '--dk-progress-header-gap': ref('space.sm')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-progress-label-color': alias('status-neutral-fg'),
          '--dk-progress-label-size': ref('type.xs'),
          '--dk-progress-label-weight': literal('650')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-progress-label-size': ref('type.sm')
        }
      }
    ],
    value: [
      {
        style: {
          '--dk-progress-value-color': alias('field-helper'),
          '--dk-progress-value-size': ref('type.xs')
        }
      }
    ],
    track: [
      {
        style: {
          '--dk-progress-track-bg': ref('color.surface-dim'),
          '--dk-progress-track-radius': ref('radius.pill'),
          '--dk-progress-track-block-size': literal('10px')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-progress-track-block-size': literal('12px')
        }
      }
    ],
    indicator: [
      {
        style: {
          '--dk-progress-indicator-bg': ref('color.on-surface'),
          '--dk-progress-indicator-radius': ref('radius.pill')
        }
      },
      {
        match: { axes: { tone: 'brand' } },
        style: { '--dk-progress-indicator-bg': alias('status-brand-border') }
      },
      {
        match: { axes: { tone: 'success' } },
        style: { '--dk-progress-indicator-bg': alias('status-success-border') }
      },
      {
        match: { axes: { tone: 'warning' } },
        style: { '--dk-progress-indicator-bg': alias('status-warning-border') }
      },
      {
        match: { axes: { tone: 'danger' } },
        style: { '--dk-progress-indicator-bg': alias('status-danger-border') }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'label',
        foreground: slotVar('label', '--dk-progress-label-color'),
        background: ref('color.surface'),
        fontSize: slotVar('label', '--dk-progress-label-size'),
        fontWeight: 650
      }
    ],
    layout: {
      target: 'track',
      widths: [180, 280, 360],
      heights: [12],
      noOverflow: true,
      blockSize: slotVar('track', '--dk-progress-track-block-size')
    }
  },
  proofCases: [
    { name: 'brand-md', axes: { tone: 'brand', size: 'md' } },
    { name: 'success-sm', axes: { tone: 'success', size: 'sm' } },
    { name: 'danger-md', axes: { tone: 'danger', size: 'md' } }
  ],
  a11y: {
    role: 'progressbar',
    labelling: 'external-label'
  }
});
