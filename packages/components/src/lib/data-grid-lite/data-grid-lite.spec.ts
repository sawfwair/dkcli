import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type DataGridLiteSize = 'sm' | 'md';

export const dataGridLiteSpec: ComponentSpec = createComponentSpec({
  id: 'data-grid-lite',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'caption', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'shell', kind: 'container', required: true },
    { name: 'headerCell', kind: 'container', required: true },
    { name: 'sortButton', kind: 'control' },
    { name: 'bodyRow', kind: 'container', required: true },
    { name: 'cell', kind: 'control', required: true },
    { name: 'checkbox', kind: 'control' },
    { name: 'empty', kind: 'container' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-grid-gap': ref('space.sm')
        }
      }
    ],
    caption: [
      {
        style: {
          '--dk-grid-caption-color': alias('grid-shell-fg'),
          '--dk-grid-caption-size': ref('type.md'),
          '--dk-grid-caption-weight': literal('650')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-grid-description-color': alias('field-helper'),
          '--dk-grid-description-size': ref('type.xs')
        }
      }
    ],
    shell: [
      {
        style: {
          '--dk-grid-shell-bg': alias('grid-shell-bg'),
          '--dk-grid-shell-fg': alias('grid-shell-fg'),
          '--dk-grid-shell-border': alias('grid-shell-border'),
          '--dk-grid-shell-radius': alias('overlay-radius'),
          '--dk-grid-shell-shadow': alias('grid-pinned-shadow'),
          '--dk-grid-shell-min-width': literal('640px')
        }
      }
    ],
    headerCell: [
      {
        style: {
          '--dk-grid-header-bg': alias('grid-header-bg'),
          '--dk-grid-header-fg': alias('grid-header-fg'),
          '--dk-grid-header-size': ref('type.xs'),
          '--dk-grid-header-weight': literal('700'),
          '--dk-grid-row-block-size': literal('52px'),
          '--dk-grid-inline-padding': ref('space.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-grid-row-block-size': literal('44px'),
          '--dk-grid-inline-padding': ref('space.xs')
        }
      }
    ],
    sortButton: [
      {
        style: {
          '--dk-grid-sort-fg': alias('table-sort-affordance'),
          '--dk-grid-sort-target': literal('44px'),
          '--dk-grid-sort-size': ref('type.xs')
        }
      }
    ],
    bodyRow: [
      {
        style: {
          '--dk-grid-row-bg': literal('transparent'),
          '--dk-grid-row-hover-bg': alias('table-row-hover-bg')
        }
      }
    ],
    cell: [
      {
        style: {
          '--dk-grid-cell-bg': alias('grid-cell-bg'),
          '--dk-grid-cell-fg': alias('grid-cell-fg'),
          '--dk-grid-cell-active-bg': alias('grid-cell-active-bg'),
          '--dk-grid-cell-active-fg': alias('grid-cell-active-fg'),
          '--dk-grid-cell-size': ref('type.sm'),
          '--dk-grid-cell-target': literal('44px')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-grid-cell-size': ref('type.xs')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-grid-cell-bg': alias('grid-cell-active-bg'),
          '--dk-grid-cell-fg': alias('grid-cell-active-fg')
        }
      }
    ],
    checkbox: [
      {
        style: {
          '--dk-grid-checkbox-target': literal('44px')
        }
      }
    ],
    empty: [
      {
        style: {
          '--dk-grid-empty-fg': alias('field-helper'),
          '--dk-grid-empty-title-size': ref('type.sm')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'headerCell',
        foreground: slotVar('headerCell', '--dk-grid-header-fg'),
        background: slotVar('headerCell', '--dk-grid-header-bg'),
        fontSize: slotVar('headerCell', '--dk-grid-header-size'),
        fontWeight: 700
      },
      {
        target: 'cell',
        foreground: slotVar('cell', '--dk-grid-cell-fg'),
        background: slotVar('cell', '--dk-grid-cell-bg'),
        fontSize: slotVar('cell', '--dk-grid-cell-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'cell',
        minSize: literal('44px'),
        actualSize: slotVar('cell', '--dk-grid-cell-target'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'shell',
      widths: [320, 480, 760],
      heights: [240, 360],
      noOverflow: true,
      blockSize: literal('240px')
    }
  },
  proofCases: [
    { name: 'default-md', axes: { size: 'md' } },
    { name: 'dense-sm', axes: { size: 'sm' } },
    { name: 'active-md', axes: { size: 'md' }, states: ['selected'] }
  ],
  a11y: {
    role: 'grid',
    labelling: 'external-label'
  }
});
