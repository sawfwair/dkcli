import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type SelectSize = 'sm' | 'md' | 'lg';

export const selectSpec: ComponentSpec = createComponentSpec({
  id: 'select',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'trigger', kind: 'control', required: true },
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
          '--dk-select-offset': literal('8px')
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
    trigger: [
      {
        style: {
          '--dk-select-trigger-bg': alias('field-bg'),
          '--dk-select-trigger-fg': alias('field-fg'),
          '--dk-select-trigger-border': alias('field-border'),
          '--dk-select-trigger-block-size': literal('48px'),
          '--dk-select-trigger-inline-padding': ref('space.sm'),
          '--dk-select-trigger-radius': alias('control-radius'),
          '--dk-select-trigger-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-select-trigger-block-size': literal('44px'),
          '--dk-select-trigger-font-size': ref('type.base')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-select-trigger-block-size': literal('52px'),
          '--dk-select-trigger-inline-padding': ref('space.md'),
          '--dk-select-trigger-font-size': ref('type.md')
        }
      },
      {
        match: { states: { 'focus-visible': true, open: true } },
        style: {
          '--dk-select-trigger-border': alias('field-focus-ring')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-select-trigger-border': alias('field-error')
        }
      }
    ],
    icon: [
      {
        style: {
          '--dk-select-icon-size': literal('1rem'),
          '--dk-select-icon-color': alias('field-helper')
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
          '--dk-select-surface-bg': alias('overlay-bg'),
          '--dk-select-surface-fg': alias('overlay-fg'),
          '--dk-select-surface-border': alias('overlay-border'),
          '--dk-select-surface-radius': alias('overlay-radius'),
          '--dk-select-surface-shadow': alias('overlay-shadow'),
          '--dk-select-surface-width': literal('300px'),
          '--dk-select-surface-padding': ref('space.xs')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-select-item-bg': literal('transparent'),
          '--dk-select-item-fg': alias('list-row-fg'),
          '--dk-select-item-radius': alias('control-radius'),
          '--dk-select-item-min-height': literal('44px'),
          '--dk-select-item-inline-padding': ref('space.sm')
        }
      },
      {
        match: { states: { hover: true, selected: true } },
        style: {
          '--dk-select-item-bg': alias('list-row-highlight-bg'),
          '--dk-select-item-fg': alias('list-row-highlight-fg')
        }
      }
    ],
    itemLabel: [
      {
        style: {
          '--dk-select-item-label-size': ref('type.sm'),
          '--dk-select-item-label-weight': literal('550')
        }
      }
    ],
    itemDescription: [
      {
        style: {
          '--dk-select-item-description-size': ref('type.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'trigger',
        foreground: slotVar('trigger', '--dk-select-trigger-fg'),
        background: slotVar('trigger', '--dk-select-trigger-bg'),
        fontSize: slotVar('trigger', '--dk-select-trigger-font-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'trigger',
        minSize: literal('44px'),
        actualSize: slotVar('trigger', '--dk-select-trigger-block-size'),
        modality: 'touch'
      }
    ],
    optionRow: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-select-item-min-height'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-select-surface-width'),
        surfaceHeight: literal('280px'),
        offset: slotVar('root', '--dk-select-offset'),
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
