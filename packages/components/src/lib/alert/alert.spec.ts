import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type AlertTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export const alertSpec: ComponentSpec = createComponentSpec({
  id: 'alert',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'icon', kind: 'icon' },
    { name: 'title', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'actions', kind: 'container' },
    { name: 'dismiss', kind: 'control' }
  ],
  axes: [{ name: 'tone', values: ['neutral', 'brand', 'success', 'warning', 'danger'], default: 'neutral' }],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-alert-bg': alias('status-neutral-bg'),
          '--dk-alert-fg': alias('status-neutral-fg'),
          '--dk-alert-border': alias('status-neutral-border'),
          '--dk-alert-border-width': literal('1px'),
          '--dk-alert-radius': ref('radius.lg'),
          '--dk-alert-padding': ref('space.md'),
          '--dk-alert-gap': ref('space.sm')
        }
      },
      {
        match: { axes: { tone: 'brand' } },
        style: {
          '--dk-alert-bg': alias('status-brand-bg'),
          '--dk-alert-fg': alias('status-brand-fg'),
          '--dk-alert-border': alias('status-brand-border')
        }
      },
      {
        match: { axes: { tone: 'success' } },
        style: {
          '--dk-alert-bg': alias('status-success-bg'),
          '--dk-alert-fg': alias('status-success-fg'),
          '--dk-alert-border': alias('status-success-border')
        }
      },
      {
        match: { axes: { tone: 'warning' } },
        style: {
          '--dk-alert-bg': alias('status-warning-bg'),
          '--dk-alert-fg': alias('status-warning-fg'),
          '--dk-alert-border': alias('status-warning-border')
        }
      },
      {
        match: { axes: { tone: 'danger' } },
        style: {
          '--dk-alert-bg': alias('status-danger-bg'),
          '--dk-alert-fg': alias('status-danger-fg'),
          '--dk-alert-border': alias('status-danger-border')
        }
      }
    ],
    icon: [
      {
        style: {
          '--dk-alert-icon-size': ref('type.sm')
        }
      }
    ],
    title: [
      {
        style: {
          '--dk-alert-title-color': literal('inherit'),
          '--dk-alert-title-size': ref('type.sm'),
          '--dk-alert-title-weight': literal('700')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-alert-description-color': literal('inherit'),
          '--dk-alert-description-size': ref('type.xs')
        }
      }
    ],
    actions: [
      {
        style: {
          '--dk-alert-actions-gap': ref('space.xs')
        }
      }
    ],
    dismiss: [
      {
        style: {
          '--dk-alert-dismiss-size': literal('44px')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'root',
        foreground: slotVar('root', '--dk-alert-fg'),
        background: slotVar('root', '--dk-alert-bg'),
        fontSize: slotVar('title', '--dk-alert-title-size'),
        fontWeight: 700
      },
      {
        target: 'root',
        foreground: slotVar('root', '--dk-alert-fg'),
        background: slotVar('root', '--dk-alert-bg'),
        fontSize: slotVar('description', '--dk-alert-description-size'),
        fontWeight: 500,
        minLc: 30
      }
    ],
    target: [
      {
        target: 'dismiss',
        minSize: literal('44px'),
        actualSize: slotVar('dismiss', '--dk-alert-dismiss-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [280, 360],
      heights: [120, 160],
      noOverflow: true,
      blockSize: literal('120px')
    },
    helperText: [
      {
        target: 'description',
        widths: [280, 360],
        fontSize: slotVar('description', '--dk-alert-description-size'),
        maxLines: 4,
        sampleText: 'Release blocked until the final content review is completed and the approval is recorded.'
      }
    ]
  },
  proofCases: [
    { name: 'neutral', axes: { tone: 'neutral' } },
    { name: 'brand', axes: { tone: 'brand' } },
    { name: 'success', axes: { tone: 'success' } },
    { name: 'warning', axes: { tone: 'warning' } },
    { name: 'danger', axes: { tone: 'danger' } }
  ],
  a11y: {
    role: 'status',
    labelling: 'slot-label'
  }
});
