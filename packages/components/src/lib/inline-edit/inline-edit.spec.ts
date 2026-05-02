import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type InlineEditSize = 'sm' | 'md' | 'lg';

export const inlineEditSpec: ComponentSpec = createComponentSpec({
  id: 'inline-edit',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'display', kind: 'control', required: true },
    { name: 'field', kind: 'control', required: true },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'actions', kind: 'container' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-inline-gap': literal('0.45rem')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-inline-label-color': alias('field-fg'),
          '--dk-inline-label-size': ref('type.sm'),
          '--dk-inline-label-weight': literal('600')
        }
      }
    ],
    display: [
      {
        style: {
          '--dk-inline-display-bg': alias('field-bg'),
          '--dk-inline-display-fg': alias('field-fg'),
          '--dk-inline-display-border': alias('field-border'),
          '--dk-inline-display-radius': alias('control-radius'),
          '--dk-inline-display-block-size': literal('44px'),
          '--dk-inline-display-inline-padding': ref('space.sm'),
          '--dk-inline-display-font-size': ref('type.sm')
        }
      }
    ],
    field: [
      {
        style: {
          '--dk-inline-field-bg': alias('field-bg'),
          '--dk-inline-field-fg': alias('field-fg'),
          '--dk-inline-field-border': alias('field-focus-ring'),
          '--dk-inline-field-radius': alias('control-radius'),
          '--dk-inline-field-block-size': literal('44px'),
          '--dk-inline-field-inline-padding': ref('space.sm'),
          '--dk-inline-field-font-size': ref('type.sm')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-inline-description-color': alias('field-helper'),
          '--dk-inline-description-size': ref('type.xs')
        }
      }
    ],
    actions: [
      {
        style: {
          '--dk-inline-actions-gap': ref('space.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'display',
        foreground: slotVar('display', '--dk-inline-display-fg'),
        background: slotVar('display', '--dk-inline-display-bg'),
        fontSize: slotVar('display', '--dk-inline-display-font-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'display',
        minSize: literal('44px'),
        actualSize: slotVar('display', '--dk-inline-display-block-size'),
        modality: 'touch'
      }
    ]
  },
  proofCases: [{ name: 'default-md', axes: { size: 'md' } }],
  a11y: {
    role: 'textbox',
    keyboardModel: 'inline-edit',
    labelling: 'external-label'
  }
});
