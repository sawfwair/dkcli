import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type EmptyStateTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type EmptyStateSize = 'sm' | 'md' | 'lg';

export const emptyStateSpec: ComponentSpec = createComponentSpec({
  id: 'empty-state',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'icon', kind: 'icon' },
    { name: 'title', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'body' },
    { name: 'actions', kind: 'container' }
  ],
  axes: [
    { name: 'tone', values: ['neutral', 'brand', 'success', 'warning', 'danger'], default: 'neutral' },
    { name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }
  ],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-empty-bg': alias('display-card-bg'),
          '--dk-empty-fg': alias('display-card-fg'),
          '--dk-empty-border': alias('display-card-border'),
          '--dk-empty-radius': ref('radius.lg'),
          '--dk-empty-padding': ref('space.lg'),
          '--dk-empty-gap': ref('space.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-empty-padding': ref('space.md')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-empty-padding': ref('space.lg')
        }
      },
      {
        match: { axes: { tone: 'brand' } },
        style: {
          '--dk-empty-border': alias('status-brand-border')
        }
      },
      {
        match: { axes: { tone: 'success' } },
        style: {
          '--dk-empty-border': alias('status-success-border')
        }
      },
      {
        match: { axes: { tone: 'warning' } },
        style: {
          '--dk-empty-border': alias('status-warning-border')
        }
      },
      {
        match: { axes: { tone: 'danger' } },
        style: {
          '--dk-empty-border': alias('status-danger-border')
        }
      }
    ],
    icon: [
      {
        style: {
          '--dk-empty-icon-size': literal('2rem'),
          '--dk-empty-icon-color': alias('status-brand-border'),
          '--dk-empty-icon-shell-bg': ref('color.surface-dim')
        }
      }
    ],
    title: [
      {
        style: {
          '--dk-empty-title-color': alias('display-card-fg'),
          '--dk-empty-title-size': ref('type.md'),
          '--dk-empty-title-weight': literal('680')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-empty-title-size': ref('type.lg')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-empty-description-color': alias('field-helper'),
          '--dk-empty-description-size': ref('type.sm')
        }
      }
    ],
    actions: [
      {
        style: {
          '--dk-empty-actions-gap': ref('space.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'title',
        foreground: slotVar('title', '--dk-empty-title-color'),
        background: slotVar('root', '--dk-empty-bg'),
        fontSize: slotVar('title', '--dk-empty-title-size'),
        fontWeight: 680
      },
      {
        target: 'description',
        foreground: slotVar('description', '--dk-empty-description-color'),
        background: slotVar('root', '--dk-empty-bg'),
        fontSize: slotVar('description', '--dk-empty-description-size'),
        fontWeight: 500
      }
    ],
    layout: {
      target: 'root',
      widths: [280, 360, 480],
      heights: [220, 280, 340],
      noOverflow: true,
      blockSize: literal('220px')
    }
  },
  proofCases: [
    { name: 'neutral-md', axes: { tone: 'neutral', size: 'md' } },
    { name: 'brand-md', axes: { tone: 'brand', size: 'md' } },
    { name: 'danger-lg', axes: { tone: 'danger', size: 'lg' } }
  ],
  a11y: {
    role: 'group',
    labelling: 'external-label'
  }
});
