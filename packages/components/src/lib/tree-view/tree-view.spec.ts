import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export const treeViewSpec: ComponentSpec = createComponentSpec({
  id: 'tree-view',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'item', kind: 'control', required: true },
    { name: 'label', kind: 'text', role: 'cta' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'branch', kind: 'icon' }
  ],
  axes: [],
  states: ['rest', 'hover', 'focus-visible', 'open', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-tree-gap': literal('0.25rem')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-tree-item-bg': alias('tree-item-bg'),
          '--dk-tree-item-fg': alias('tree-item-fg'),
          '--dk-tree-item-radius': alias('control-radius'),
          '--dk-tree-item-min-height': literal('44px'),
          '--dk-tree-item-inline-padding': literal('0.625rem')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-tree-item-bg': alias('tree-item-selected-bg'),
          '--dk-tree-item-fg': alias('tree-item-selected-fg')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-tree-label-size': literal('0.92rem'),
          '--dk-tree-label-weight': literal('600')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-tree-description-fg': alias('field-helper'),
          '--dk-tree-description-size': literal('0.75rem')
        }
      }
    ],
    branch: [
      {
        style: {
          '--dk-tree-branch-size': literal('0.85rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'item',
        foreground: slotVar('item', '--dk-tree-item-fg'),
        background: slotVar('item', '--dk-tree-item-bg'),
        fontSize: slotVar('label', '--dk-tree-label-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-tree-item-min-height'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [240, 320],
      heights: [240, 420],
      noOverflow: true,
      blockSize: slotVar('item', '--dk-tree-item-min-height')
    }
  },
  proofCases: [{ name: 'default' }, { name: 'selected', states: ['selected'] }],
  a11y: {
    role: 'tree',
    keyboardModel: 'hierarchy',
    labelling: 'aria-label'
  }
});
