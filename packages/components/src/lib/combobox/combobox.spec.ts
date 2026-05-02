import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type ComboboxSize = 'sm' | 'md' | 'lg';

export const comboboxSpec: ComponentSpec = createComponentSpec({
  id: 'combobox',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'input', kind: 'control', required: true },
    { name: 'icon', kind: 'icon' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' },
    { name: 'surface', kind: 'container', required: true },
    { name: 'item', kind: 'control', required: true },
    { name: 'itemLabel', kind: 'text', role: 'cta' },
    { name: 'itemDescription', kind: 'text', role: 'support' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'open', 'selected', 'disabled', 'invalid'],
  recipe: {
    root: [
      {
        style: {
          '--dk-field-stack-gap': literal('0.45rem'),
          '--dk-motion-duration': ref('motion.normal'),
          '--dk-combobox-offset': literal('8px')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-field-label-color': alias('field-fg'),
          '--dk-field-label-size': ref('type.sm'),
          '--dk-field-label-weight': literal('600')
        }
      }
    ],
    input: [
      {
        style: {
          '--dk-combobox-input-bg': alias('field-bg'),
          '--dk-combobox-input-fg': alias('field-fg'),
          '--dk-combobox-input-border': alias('field-border'),
          '--dk-combobox-input-block-size': literal('48px'),
          '--dk-combobox-input-inline-padding': ref('space.sm'),
          '--dk-combobox-input-radius': alias('control-radius'),
          '--dk-combobox-input-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-combobox-input-block-size': literal('44px'),
          '--dk-combobox-input-font-size': ref('type.base')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-combobox-input-block-size': literal('52px'),
          '--dk-combobox-input-inline-padding': ref('space.md'),
          '--dk-combobox-input-font-size': ref('type.md')
        }
      },
      {
        match: { states: { open: true } },
        style: {
          '--dk-combobox-input-border': alias('field-focus-ring')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-combobox-input-border': alias('field-error')
        }
      }
    ],
    icon: [
      {
        style: {
          '--dk-combobox-icon-size': literal('1rem'),
          '--dk-combobox-icon-color': alias('field-helper')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-field-description-color': alias('field-helper'),
          '--dk-field-description-size': ref('type.xs')
        }
      }
    ],
    error: [
      {
        style: {
          '--dk-field-error-color': alias('field-error'),
          '--dk-field-error-size': ref('type.xs')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-combobox-surface-bg': alias('floating-bg'),
          '--dk-combobox-surface-fg': alias('floating-fg'),
          '--dk-combobox-surface-border': alias('floating-border'),
          '--dk-combobox-surface-radius': alias('overlay-radius'),
          '--dk-combobox-surface-shadow': alias('floating-shadow'),
          '--dk-combobox-surface-width': literal('320px'),
          '--dk-combobox-surface-padding': ref('space.xs')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-combobox-item-bg': literal('transparent'),
          '--dk-combobox-item-fg': alias('list-row-fg'),
          '--dk-combobox-item-radius': alias('control-radius'),
          '--dk-combobox-item-min-height': literal('44px'),
          '--dk-combobox-item-inline-padding': ref('space.sm')
        }
      },
      {
        match: { states: { hover: true } },
        style: {
          '--dk-combobox-item-bg': alias('list-row-highlight-bg'),
          '--dk-combobox-item-fg': alias('list-row-highlight-fg')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-combobox-item-bg': alias('list-row-highlight-bg'),
          '--dk-combobox-item-fg': alias('list-row-highlight-fg')
        }
      }
    ],
    itemLabel: [
      {
        style: {
          '--dk-combobox-item-label-size': ref('type.sm'),
          '--dk-combobox-item-label-weight': literal('550')
        }
      }
    ],
    itemDescription: [
      {
        style: {
          '--dk-combobox-item-description-size': ref('type.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'input',
        foreground: slotVar('input', '--dk-combobox-input-fg'),
        background: slotVar('input', '--dk-combobox-input-bg'),
        fontSize: slotVar('input', '--dk-combobox-input-font-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'input',
        minSize: literal('44px'),
        actualSize: slotVar('input', '--dk-combobox-input-block-size'),
        modality: 'touch'
      }
    ],
    optionRow: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-combobox-item-min-height'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-combobox-surface-width'),
        surfaceHeight: literal('280px'),
        offset: slotVar('root', '--dk-combobox-offset'),
        viewportPadding: 16
      }
    ]
  },
  proofCases: [
    { name: 'default' },
    { name: 'selected', states: ['selected'] },
    { name: 'invalid', states: ['invalid'] }
  ],
  a11y: {
    role: 'combobox',
    keyboardModel: 'selection-group',
    labelling: 'external-label'
  }
});
