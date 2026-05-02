import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type SegmentedControlSize = 'sm' | 'md';

export const segmentedControlSpec: ComponentSpec = createComponentSpec({
  id: 'segmented-control',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'group', kind: 'container', required: true },
    { name: 'item', kind: 'control', required: true },
    { name: 'label', kind: 'text', role: 'cta' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-segmented-gap': ref('space.xs')
        }
      }
    ],
    group: [
      {
        style: {
          '--dk-segmented-group-bg': ref('color.surface-dim'),
          '--dk-segmented-group-border': alias('nav-separator-fg'),
          '--dk-segmented-group-radius': alias('control-radius'),
          '--dk-segmented-group-gap': ref('space.2xs'),
          '--dk-segmented-group-padding': literal('0.1875rem')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-segmented-item-bg': ref('color.surface-dim'),
          '--dk-segmented-item-fg': alias('nav-item-fg'),
          '--dk-segmented-item-radius': alias('control-radius'),
          '--dk-segmented-item-block-size': literal('44px'),
          '--dk-segmented-item-inline-padding': ref('space.sm'),
          '--dk-segmented-item-font-size': ref('type.xs'),
          '--dk-segmented-item-font-weight': literal('650')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-segmented-item-inline-padding': ref('space.md'),
          '--dk-segmented-item-font-size': ref('type.sm')
        }
      },
      {
        match: { states: { hover: true } },
        style: {
          '--dk-segmented-item-bg': ref('color.surface-bright')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-segmented-item-bg': alias('nav-current-bg'),
          '--dk-segmented-item-fg': ref('color.on-primary-container')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-segmented-item-fg': alias('nav-disabled-fg')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-segmented-label-size': ref('type.xs')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-segmented-label-size': ref('type.sm')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'item',
        foreground: slotVar('item', '--dk-segmented-item-fg'),
        background: slotVar('item', '--dk-segmented-item-bg'),
        fontSize: slotVar('item', '--dk-segmented-item-font-size'),
        fontWeight: 650
      }
    ],
    target: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-segmented-item-block-size'),
        modality: 'touch'
      }
    ]
  },
  proofCases: [{ name: 'default' }, { name: 'selected', states: ['selected'] }],
  a11y: {
    role: 'radiogroup',
    keyboardModel: 'selection-group',
    labelling: 'external-label'
  }
});
