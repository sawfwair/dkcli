import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type BadgeEmphasis = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

export const badgeSpec: ComponentSpec = createComponentSpec({
  id: 'badge',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'leading', kind: 'icon' },
    { name: 'label', kind: 'text', role: 'meta' }
  ],
  axes: [
    { name: 'tone', values: ['neutral', 'brand', 'success', 'warning', 'danger'], default: 'neutral' },
    { name: 'emphasis', values: ['soft', 'solid', 'outline'], default: 'soft' },
    { name: 'size', values: ['sm', 'md'], default: 'md' }
  ],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-badge-bg': alias('status-neutral-bg'),
          '--dk-badge-fg': alias('status-neutral-fg'),
          '--dk-badge-border': alias('status-neutral-border'),
          '--dk-badge-border-width': literal('1px'),
          '--dk-badge-radius': ref('radius.pill'),
          '--dk-badge-gap': ref('space.2xs'),
          '--dk-badge-block-size': literal('30px'),
          '--dk-badge-inline-padding': ref('space.xs')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-badge-block-size': literal('26px')
        }
      },
      {
        match: { axes: { tone: 'brand' } },
        style: {
          '--dk-badge-bg': alias('status-brand-bg'),
          '--dk-badge-fg': alias('status-brand-fg'),
          '--dk-badge-border': alias('status-brand-border')
        }
      },
      {
        match: { axes: { tone: 'success' } },
        style: {
          '--dk-badge-bg': alias('status-success-bg'),
          '--dk-badge-fg': alias('status-success-fg'),
          '--dk-badge-border': alias('status-success-border')
        }
      },
      {
        match: { axes: { tone: 'warning' } },
        style: {
          '--dk-badge-bg': alias('status-warning-bg'),
          '--dk-badge-fg': alias('status-warning-fg'),
          '--dk-badge-border': alias('status-warning-border')
        }
      },
      {
        match: { axes: { tone: 'danger' } },
        style: {
          '--dk-badge-bg': alias('status-danger-bg'),
          '--dk-badge-fg': alias('status-danger-fg'),
          '--dk-badge-border': alias('status-danger-border')
        }
      },
      {
        match: { axes: { emphasis: 'solid', tone: 'neutral' } },
        style: {
          '--dk-badge-bg': ref('color.on-surface'),
          '--dk-badge-fg': ref('color.surface'),
          '--dk-badge-border': ref('color.on-surface')
        }
      },
      {
        match: { axes: { emphasis: 'solid', tone: 'success' } },
        style: {
          '--dk-badge-bg': ref('color.surface-bright'),
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'outline' } },
        style: {
          '--dk-badge-bg': ref('color.surface-bright')
        }
      },
      {
        match: { axes: { emphasis: 'outline', tone: 'brand' } },
        style: {
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'outline', tone: 'success' } },
        style: {
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'outline', tone: 'warning' } },
        style: {
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'outline', tone: 'danger' } },
        style: {
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'soft', tone: 'success' } },
        style: {
          '--dk-badge-bg': ref('color.surface-bright'),
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'soft', tone: 'warning' } },
        style: {
          '--dk-badge-bg': ref('color.surface-bright'),
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      },
      {
        match: { axes: { emphasis: 'soft', tone: 'danger' } },
        style: {
          '--dk-badge-bg': ref('color.surface-bright'),
          '--dk-badge-fg': alias('status-neutral-fg')
        }
      }
    ],
    leading: [
      {
        style: {
          '--dk-badge-leading-size': literal('0.82rem')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-badge-label-color': literal('inherit'),
          '--dk-badge-label-size': literal('0.8125rem'),
          '--dk-badge-label-weight': literal('650')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-badge-label-size': ref('type.sm')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'root',
        foreground: slotVar('root', '--dk-badge-fg'),
        background: slotVar('root', '--dk-badge-bg'),
        fontSize: slotVar('label', '--dk-badge-label-size'),
        fontWeight: 650
      }
    ],
    layout: {
      target: 'root',
      widths: [120, 200],
      heights: [30],
      noOverflow: true,
      blockSize: slotVar('root', '--dk-badge-block-size'),
      inlinePadding: slotVar('root', '--dk-badge-inline-padding'),
      gap: slotVar('root', '--dk-badge-gap'),
      labelFontSize: slotVar('label', '--dk-badge-label-size'),
      iconSize: slotVar('leading', '--dk-badge-leading-size')
    }
  },
  proofCases: [
    { name: 'neutral-soft', axes: { tone: 'neutral', emphasis: 'soft', size: 'md' }, sampleText: 'Draft' },
    { name: 'neutral-solid', axes: { tone: 'neutral', emphasis: 'solid', size: 'md' }, sampleText: 'Draft' },
    { name: 'neutral-outline', axes: { tone: 'neutral', emphasis: 'outline', size: 'md' }, sampleText: 'Draft' },
    { name: 'brand-soft', axes: { tone: 'brand', emphasis: 'soft', size: 'md' }, sampleText: 'Launch' },
    { name: 'brand-solid', axes: { tone: 'brand', emphasis: 'solid', size: 'md' }, sampleText: 'Launch' },
    { name: 'brand-outline', axes: { tone: 'brand', emphasis: 'outline', size: 'md' }, sampleText: 'Launch' },
    { name: 'success-soft', axes: { tone: 'success', emphasis: 'soft', size: 'md' }, sampleText: 'Healthy' },
    { name: 'success-solid', axes: { tone: 'success', emphasis: 'solid', size: 'md' }, sampleText: 'Healthy' },
    { name: 'success-outline', axes: { tone: 'success', emphasis: 'outline', size: 'md' }, sampleText: 'Healthy' },
    { name: 'warning-soft', axes: { tone: 'warning', emphasis: 'soft', size: 'md' }, sampleText: 'Review' },
    { name: 'warning-solid', axes: { tone: 'warning', emphasis: 'solid', size: 'md' }, sampleText: 'Review' },
    { name: 'warning-outline', axes: { tone: 'warning', emphasis: 'outline', size: 'md' }, sampleText: 'Review' },
    { name: 'danger-soft', axes: { tone: 'danger', emphasis: 'soft', size: 'md' }, sampleText: 'Failed' },
    { name: 'danger-solid', axes: { tone: 'danger', emphasis: 'solid', size: 'md' }, sampleText: 'Failed' },
    { name: 'danger-outline', axes: { tone: 'danger', emphasis: 'outline', size: 'md' }, sampleText: 'Failed' }
  ],
  a11y: {
    role: 'status',
    labelling: 'external-label'
  }
});
