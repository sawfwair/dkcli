import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type FileUploadSize = 'sm' | 'md' | 'lg';

export const fileUploadSpec: ComponentSpec = createComponentSpec({
  id: 'file-upload',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'field', kind: 'container', required: true },
    { name: 'button', kind: 'control', required: true },
    { name: 'copy', kind: 'text', role: 'body' },
    { name: 'list', kind: 'container' },
    { name: 'item', kind: 'text', role: 'meta' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'disabled', 'invalid'],
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
          '--dk-file-upload-bg': alias('field-bg'),
          '--dk-file-upload-fg': alias('field-fg'),
          '--dk-file-upload-border': alias('field-border'),
          '--dk-file-upload-radius': alias('control-radius'),
          '--dk-file-upload-padding': ref('space.md'),
          '--dk-file-upload-gap': ref('space.sm'),
          '--dk-file-upload-button-bg': alias('status-brand-bg'),
          '--dk-file-upload-button-fg': alias('status-brand-fg'),
          '--dk-file-upload-button-radius': alias('control-radius'),
          '--dk-file-upload-button-block-size': literal('44px'),
          '--dk-file-upload-button-inline-padding': ref('space.sm'),
          '--dk-file-upload-button-font-size': ref('type.sm'),
          '--dk-file-upload-copy-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-file-upload-padding': ref('space.sm'),
          '--dk-file-upload-copy-size': ref('type.xs')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-file-upload-padding': ref('space.lg'),
          '--dk-file-upload-button-block-size': literal('48px'),
          '--dk-file-upload-button-inline-padding': ref('space.md'),
          '--dk-file-upload-button-font-size': ref('type.md')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-file-upload-border': alias('field-error')
        }
      }
    ],
    button: [
      {
        style: {
          '--dk-file-upload-button-weight': literal('650')
        }
      }
    ],
    copy: [
      {
        style: {
          '--dk-file-upload-copy-color': alias('field-helper')
        }
      }
    ],
    list: [
      {
        style: {
          '--dk-file-upload-list-gap': ref('space.2xs')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-file-upload-item-size': ref('type.xs')
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
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'copy',
        foreground: slotVar('copy', '--dk-file-upload-copy-color'),
        background: slotVar('field', '--dk-file-upload-bg'),
        fontSize: slotVar('field', '--dk-file-upload-copy-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'button',
        minSize: literal('44px'),
        actualSize: slotVar('field', '--dk-file-upload-button-block-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'field',
      widths: [280, 360, 460],
      heights: [120, 160],
      noOverflow: true,
      blockSize: literal('120px')
    }
  },
  proofCases: [
    { name: 'default' },
    { name: 'large', axes: { size: 'lg' } },
    { name: 'invalid', states: ['invalid'] }
  ],
  a11y: {
    role: 'group',
    labelling: 'external-label'
  }
});
