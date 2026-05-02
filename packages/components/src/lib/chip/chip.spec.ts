import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type ChipTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type ChipSize = 'sm' | 'md';

export const chipSpec: ComponentSpec = createComponentSpec({
  id: 'chip',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'button', kind: 'control', required: true },
    { name: 'leading', kind: 'icon' },
    { name: 'label', kind: 'text', role: 'meta' },
    { name: 'dismiss', kind: 'control' }
  ],
  axes: [
    { name: 'tone', values: ['neutral', 'brand', 'success', 'warning', 'danger'], default: 'neutral' },
    { name: 'size', values: ['sm', 'md'], default: 'md' }
  ],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-chip-gap': ref('space.2xs')
        }
      }
    ],
    button: [
      {
        style: {
          '--dk-chip-bg': alias('status-neutral-bg'),
          '--dk-chip-fg': alias('status-neutral-fg'),
          '--dk-chip-border': alias('status-neutral-border'),
          '--dk-chip-radius': ref('radius.pill'),
          '--dk-chip-gap': ref('space.2xs'),
          '--dk-chip-block-size': literal('36px'),
          '--dk-chip-inline-padding': ref('space.sm'),
          '--dk-chip-font-size': ref('type.xs'),
          '--dk-chip-font-weight': literal('650'),
          '--dk-chip-dismiss-size': literal('24px')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-chip-block-size': literal('40px'),
          '--dk-chip-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { tone: 'brand' } },
        style: {
          '--dk-chip-bg': alias('status-brand-bg'),
          '--dk-chip-fg': alias('status-brand-fg'),
          '--dk-chip-border': alias('status-brand-border')
        }
      },
      {
        match: { axes: { tone: 'success' } },
        style: {
          '--dk-chip-bg': alias('status-success-bg'),
          '--dk-chip-fg': alias('status-success-fg'),
          '--dk-chip-border': alias('status-success-border')
        }
      },
      {
        match: { axes: { tone: 'warning' } },
        style: {
          '--dk-chip-bg': alias('status-warning-bg'),
          '--dk-chip-fg': alias('status-warning-fg'),
          '--dk-chip-border': alias('status-warning-border')
        }
      },
      {
        match: { axes: { tone: 'danger' } },
        style: {
          '--dk-chip-bg': alias('status-danger-bg'),
          '--dk-chip-fg': alias('status-danger-fg'),
          '--dk-chip-border': alias('status-danger-border')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-chip-bg': alias('nav-current-bg'),
          '--dk-chip-fg': ref('color.on-primary-container'),
          '--dk-chip-border': alias('nav-current-fg')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-chip-fg': alias('nav-disabled-fg')
        }
      }
    ],
    leading: [
      {
        style: {
          '--dk-chip-leading-size': literal('0.85rem')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-chip-label-size': ref('type.xs'),
          '--dk-chip-label-weight': literal('650')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-chip-label-size': ref('type.sm')
        }
      }
    ],
    dismiss: [
      {
        style: {
          '--dk-chip-dismiss-size': literal('24px')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'button',
        foreground: slotVar('button', '--dk-chip-fg'),
        background: slotVar('button', '--dk-chip-bg'),
        fontSize: slotVar('button', '--dk-chip-font-size'),
        fontWeight: 650
      }
    ],
    target: [
      {
        target: 'button',
        minSize: literal('36px'),
        actualSize: slotVar('button', '--dk-chip-block-size'),
        modality: 'mouse'
      }
    ],
    layout: {
      target: 'button',
      widths: [120, 200],
      heights: [36, 40],
      noOverflow: true,
      blockSize: slotVar('button', '--dk-chip-block-size'),
      inlinePadding: slotVar('button', '--dk-chip-inline-padding'),
      gap: slotVar('button', '--dk-chip-gap'),
      labelFontSize: slotVar('label', '--dk-chip-label-size'),
      iconSize: slotVar('leading', '--dk-chip-leading-size')
    }
  },
  proofCases: [
    { name: 'neutral', axes: { tone: 'neutral', size: 'md' } },
    { name: 'brand-selected', axes: { tone: 'brand', size: 'md' }, states: ['selected'] },
    { name: 'danger', axes: { tone: 'danger', size: 'sm' } }
  ],
  a11y: {
    role: 'group',
    labelling: 'external-label'
  }
});
