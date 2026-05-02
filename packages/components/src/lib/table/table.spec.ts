import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type TableSize = 'sm' | 'md';

export const tableSpec: ComponentSpec = createComponentSpec({
  id: 'table',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'caption', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'shell', kind: 'container', required: true },
    { name: 'headerCell', kind: 'container', required: true },
    { name: 'sortButton', kind: 'control' },
    { name: 'bodyRow', kind: 'container', required: true },
    { name: 'cell', kind: 'text', role: 'body' },
    { name: 'checkbox', kind: 'control' },
    { name: 'empty', kind: 'container' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-table-gap': ref('space.sm'),
          '--dk-table-motion-duration': ref('motion.fast')
        }
      }
    ],
    caption: [
      {
        style: {
          '--dk-table-caption-color': alias('table-shell-fg'),
          '--dk-table-caption-size': ref('type.md'),
          '--dk-table-caption-weight': literal('650')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-table-description-color': alias('field-helper'),
          '--dk-table-description-size': ref('type.xs')
        }
      }
    ],
    shell: [
      {
        style: {
          '--dk-table-shell-bg': alias('table-shell-bg'),
          '--dk-table-shell-fg': alias('table-shell-fg'),
          '--dk-table-shell-border': alias('table-divider'),
          '--dk-table-shell-radius': alias('overlay-radius'),
          '--dk-table-shell-shadow': alias('table-sticky-header-shadow'),
          '--dk-table-shell-min-width': literal('640px')
        }
      }
    ],
    headerCell: [
      {
        style: {
          '--dk-table-header-bg': alias('table-header-bg'),
          '--dk-table-header-fg': alias('table-header-fg'),
          '--dk-table-header-size': ref('type.xs'),
          '--dk-table-header-weight': literal('700'),
          '--dk-table-row-block-size': literal('52px'),
          '--dk-table-inline-padding': ref('space.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-table-row-block-size': literal('44px'),
          '--dk-table-inline-padding': ref('space.xs')
        }
      }
    ],
    sortButton: [
      {
        style: {
          '--dk-table-sort-fg': alias('table-sort-affordance'),
          '--dk-table-sort-size': ref('type.xs'),
          '--dk-table-sort-target': literal('44px')
        }
      }
    ],
    bodyRow: [
      {
        style: {
          '--dk-table-row-bg': literal('transparent'),
          '--dk-table-row-fg': alias('table-cell-fg'),
          '--dk-table-row-hover-bg': alias('table-row-hover-bg'),
          '--dk-table-row-selected-bg': alias('table-row-selected-bg'),
          '--dk-table-row-selected-fg': alias('table-row-selected-fg')
        }
      }
    ],
    cell: [
      {
        style: {
          '--dk-table-cell-color': alias('table-cell-fg'),
          '--dk-table-cell-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-table-cell-size': ref('type.xs')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-table-cell-color': alias('table-row-selected-fg')
        }
      }
    ],
    checkbox: [
      {
        style: {
          '--dk-table-checkbox-size': literal('18px'),
          '--dk-table-checkbox-target': literal('44px'),
          '--dk-table-checkbox-border': alias('choice-border'),
          '--dk-table-checkbox-bg': alias('choice-bg'),
          '--dk-table-checkbox-checked-bg': alias('choice-selected-bg')
        }
      }
    ],
    empty: [
      {
        style: {
          '--dk-table-empty-bg': alias('table-shell-bg'),
          '--dk-table-empty-fg': alias('field-helper'),
          '--dk-table-empty-title-size': ref('type.sm')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'headerCell',
        foreground: slotVar('headerCell', '--dk-table-header-fg'),
        background: slotVar('headerCell', '--dk-table-header-bg'),
        fontSize: slotVar('headerCell', '--dk-table-header-size'),
        fontWeight: 700
      },
      {
        target: 'cell',
        foreground: slotVar('cell', '--dk-table-cell-color'),
        background: slotVar('shell', '--dk-table-shell-bg'),
        fontSize: slotVar('cell', '--dk-table-cell-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'sortButton',
        minSize: literal('44px'),
        actualSize: slotVar('sortButton', '--dk-table-sort-target'),
        modality: 'touch'
      },
      {
        target: 'checkbox',
        minSize: literal('44px'),
        actualSize: slotVar('checkbox', '--dk-table-checkbox-target'),
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
    { name: 'selected-md', axes: { size: 'md' }, states: ['selected'] }
  ],
  a11y: {
    role: 'table',
    labelling: 'external-label'
  }
});
