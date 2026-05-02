import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type TextareaSize = 'sm' | 'md' | 'lg';

export const textareaSpec: ComponentSpec = createComponentSpec({
  id: 'textarea',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'field', kind: 'control', required: true },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'invalid', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-field-stack-gap': literal('0.45rem')
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
    field: [
      {
        style: {
          '--dk-textarea-bg': alias('field-bg'),
          '--dk-textarea-fg': alias('field-fg'),
          '--dk-textarea-border': alias('field-border'),
          '--dk-textarea-border-width': literal('1px'),
          '--dk-textarea-radius': alias('control-radius'),
          '--dk-textarea-block-size': literal('136px'),
          '--dk-textarea-inline-padding': ref('space.sm'),
          '--dk-textarea-block-padding': ref('space.sm'),
          '--dk-textarea-font-size': ref('type.sm'),
          '--dk-textarea-placeholder': alias('field-placeholder'),
          '--dk-textarea-shadow': literal('none'),
          '--dk-textarea-focus-ring-color': alias('field-focus-ring'),
          '--dk-textarea-motion-duration': ref('motion.normal')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-textarea-block-size': literal('120px'),
          '--dk-textarea-font-size': ref('type.base')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-textarea-block-size': literal('160px'),
          '--dk-textarea-inline-padding': ref('space.md'),
          '--dk-textarea-block-padding': ref('space.md'),
          '--dk-textarea-font-size': ref('type.md')
        }
      },
      {
        match: { states: { hover: true } },
        style: { '--dk-textarea-bg': ref('color.surface-bright') }
      },
      {
        match: { states: { 'focus-visible': true } },
        style: {
          '--dk-textarea-border': alias('field-focus-ring'),
          '--dk-textarea-shadow': ref('elevation.sm')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-textarea-border': alias('field-error'),
          '--dk-textarea-focus-ring-color': alias('field-error')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-textarea-bg': ref('color.surface-dim'),
          '--dk-textarea-fg': ref('color.outline'),
          '--dk-textarea-border': ref('color.outline')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-field-description-color': alias('field-helper'),
          '--dk-field-description-size': literal('0.8125rem')
        }
      }
    ],
    error: [
      {
        style: {
          '--dk-field-error-color': alias('field-error'),
          '--dk-field-error-size': literal('0.8125rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'field',
        foreground: slotVar('field', '--dk-textarea-fg'),
        background: slotVar('field', '--dk-textarea-bg'),
        fontSize: slotVar('field', '--dk-textarea-font-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'field',
        minSize: literal('44px'),
        actualSize: literal('44px'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'field',
      widths: [260, 340, 440],
      heights: [120, 136, 160],
      noOverflow: false,
      blockSize: slotVar('field', '--dk-textarea-block-size'),
      inlinePadding: slotVar('field', '--dk-textarea-inline-padding'),
      labelFontSize: slotVar('field', '--dk-textarea-font-size')
    },
    helperText: [
      {
        target: 'description',
        widths: [260, 340],
        fontSize: slotVar('description', '--dk-field-description-size'),
        maxLines: 2,
        sampleText: 'Keep this concise so it still scans inside narrower editors.'
      }
    ]
  },
  proofCases: [
    { name: 'default', sampleText: 'Outline the decisions this release needs.' },
    { name: 'invalid', states: ['invalid'], sampleText: 'Outline the decisions this release needs.' }
  ],
  a11y: {
    role: 'textbox',
    keyboardModel: 'text-entry',
    labelling: 'external-label'
  }
});
