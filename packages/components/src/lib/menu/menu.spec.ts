import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type MenuSize = 'sm' | 'md' | 'lg';

export const menuSpec: ComponentSpec = createComponentSpec({
  id: 'menu',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'item', kind: 'control', required: true },
    { name: 'label', kind: 'text', role: 'cta' },
    { name: 'shortcut', kind: 'text', role: 'meta' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'open', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-motion-duration': ref('motion.normal'),
          '--dk-menu-offset': literal('12px')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-menu-surface-bg': alias('overlay-bg'),
          '--dk-menu-surface-fg': alias('overlay-fg'),
          '--dk-menu-surface-border': alias('overlay-border'),
          '--dk-menu-surface-radius': alias('overlay-radius'),
          '--dk-menu-surface-shadow': alias('overlay-shadow'),
          '--dk-menu-surface-width': literal('260px'),
          '--dk-menu-surface-padding': ref('space.xs')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-menu-item-bg': literal('transparent'),
          '--dk-menu-item-fg': alias('list-row-fg'),
          '--dk-menu-item-radius': alias('control-radius'),
          '--dk-menu-item-min-height': literal('44px'),
          '--dk-menu-item-inline-padding': ref('space.sm')
        }
      },
      {
        match: { states: { hover: true, selected: true } },
        style: {
          '--dk-menu-item-bg': alias('list-row-highlight-bg'),
          '--dk-menu-item-fg': alias('list-row-highlight-fg')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-menu-item-fg': ref('color.outline')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-menu-label-size': ref('type.sm'),
          '--dk-menu-label-weight': literal('550')
        }
      }
    ],
    shortcut: [
      {
        style: {
          '--dk-menu-shortcut-size': ref('type.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'item',
        foreground: slotVar('item', '--dk-menu-item-fg'),
        background: slotVar('surface', '--dk-menu-surface-bg'),
        fontSize: slotVar('label', '--dk-menu-label-size'),
        fontWeight: 550
      }
    ],
    optionRow: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-menu-item-min-height'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-menu-surface-width'),
        surfaceHeight: literal('280px'),
        offset: slotVar('root', '--dk-menu-offset'),
        viewportPadding: 16
      }
    ]
  },
  proofCases: [{ name: 'default' }, { name: 'selected', states: ['selected'] }],
  a11y: {
    role: 'menu',
    keyboardModel: 'selection-group',
    labelling: 'slot-label'
  }
});
