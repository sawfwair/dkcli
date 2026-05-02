import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type PaginationSize = 'sm' | 'md';

export const paginationSpec: ComponentSpec = createComponentSpec({
  id: 'pagination',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'nav', kind: 'control' },
    { name: 'item', kind: 'control', required: true },
    { name: 'current', kind: 'control' },
    { name: 'ellipsis', kind: 'text', role: 'meta' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md'], default: 'md' }],
  states: ['rest', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-pagination-gap': literal('0.375rem')
        }
      }
    ],
    nav: [
      {
        style: {
          '--dk-pagination-nav-fg': alias('nav-item-fg')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-pagination-item-bg': ref('color.surface-bright'),
          '--dk-pagination-item-fg': alias('nav-item-fg'),
          '--dk-pagination-item-border': ref('color.outline'),
          '--dk-pagination-item-border-width': literal('1px'),
          '--dk-pagination-item-radius': ref('radius.pill'),
          '--dk-pagination-item-size': literal('0.875rem'),
          '--dk-pagination-item-block-size': literal('44px'),
          '--dk-pagination-item-inline-size': literal('44px')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-pagination-item-size': literal('0.75rem')
        }
      }
    ],
    current: [
      {
        style: {
          '--dk-pagination-current-bg': alias('nav-current-bg'),
          '--dk-pagination-current-fg': ref('color.on-primary-container'),
          '--dk-pagination-current-border': ref('color.primary'),
          '--dk-pagination-current-size': literal('0.875rem')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-pagination-current-size': literal('0.75rem')
        }
      }
    ],
    ellipsis: [
      {
        style: {
          '--dk-pagination-ellipsis-fg': alias('nav-disabled-fg'),
          '--dk-pagination-ellipsis-size': literal('0.875rem')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-pagination-ellipsis-size': literal('0.75rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'current',
        foreground: slotVar('current', '--dk-pagination-current-fg'),
        background: slotVar('current', '--dk-pagination-current-bg'),
        fontSize: slotVar('current', '--dk-pagination-current-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-pagination-item-block-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [280, 420],
      heights: [48],
      noOverflow: true,
      blockSize: slotVar('item', '--dk-pagination-item-block-size'),
      inlinePadding: literal('0px'),
      gap: slotVar('root', '--dk-pagination-gap'),
      labelFontSize: slotVar('item', '--dk-pagination-item-size'),
      iconSize: slotVar('item', '--dk-pagination-item-size')
    }
  },
  proofCases: [
    {
      name: 'pagination-md',
      axes: { size: 'md' },
      sampleText: '1 2 3 4 5'
    }
  ],
  a11y: {
    role: 'navigation',
    labelling: 'external-label'
  }
});
