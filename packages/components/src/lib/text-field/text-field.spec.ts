import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type TextFieldSize = 'xs' | 'sm' | 'md' | 'lg';

export const textFieldSpec: ComponentSpec = createComponentSpec({
  id: 'text-field',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'field', kind: 'control', required: true },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' },
    { name: 'leading', kind: 'icon' },
    { name: 'trailing', kind: 'icon' }
  ],
  axes: [{ name: 'size', values: ['xs', 'sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'invalid', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-field-stack-gap': literal('0.45rem'),
          '--dk-field-addon-gap': literal('0.5rem')
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
      },
      {
        match: { axes: { size: 'xs' } },
        style: { '--dk-field-label-size': ref('type.sm') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-field-label-size': ref('type.base') }
      }
    ],
    field: [
      {
        style: {
          '--dk-text-field-bg': alias('field-bg'),
          '--dk-text-field-fg': alias('field-fg'),
          '--dk-text-field-border': alias('field-border'),
          '--dk-text-field-border-width': literal('1px'),
          '--dk-text-field-radius': alias('control-radius'),
          '--dk-text-field-block-size': literal('48px'),
          '--dk-text-field-inline-padding': ref('space.sm'),
          '--dk-text-field-input-font-size': ref('type.sm'),
          '--dk-text-field-placeholder': alias('field-placeholder'),
          '--dk-text-field-shadow': literal('none'),
          '--dk-text-field-focus-ring-color': alias('field-focus-ring'),
          '--dk-text-field-motion-duration': ref('motion.normal')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-text-field-block-size': literal('44px'),
          '--dk-text-field-inline-padding': ref('space.xs'),
          '--dk-text-field-input-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-text-field-block-size': literal('44px'),
          '--dk-text-field-inline-padding': ref('space.sm'),
          '--dk-text-field-input-font-size': ref('type.base')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-text-field-block-size': literal('52px'),
          '--dk-text-field-inline-padding': ref('space.md'),
          '--dk-text-field-input-font-size': ref('type.md')
        }
      },
      {
        match: { states: { hover: true } },
        style: {
          '--dk-text-field-bg': ref('color.surface-bright')
        }
      },
      {
        match: { states: { 'focus-visible': true } },
        style: {
          '--dk-text-field-border': alias('field-focus-ring'),
          '--dk-text-field-shadow': ref('elevation.sm')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-text-field-border': alias('field-error'),
          '--dk-text-field-focus-ring-color': alias('field-error')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-text-field-bg': ref('color.surface-dim'),
          '--dk-text-field-border': ref('color.outline')
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
    ],
    leading: [
      {
        style: {
          '--dk-text-field-addon-color': alias('field-helper'),
          '--dk-text-field-addon-size': literal('1rem')
        }
      }
    ],
    trailing: [
      {
        style: {
          '--dk-text-field-addon-color': alias('field-helper'),
          '--dk-text-field-addon-size': literal('1rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'field',
        foreground: slotVar('field', '--dk-text-field-fg'),
        background: slotVar('field', '--dk-text-field-bg'),
        fontSize: slotVar('field', '--dk-text-field-input-font-size'),
        fontWeight: 500
      },
      {
        target: 'field',
        foreground: slotVar('field', '--dk-text-field-placeholder'),
        background: slotVar('field', '--dk-text-field-bg'),
        fontSize: slotVar('field', '--dk-text-field-input-font-size'),
        fontWeight: 400,
        minLc: 40
      }
    ],
    target: [
      {
        target: 'field',
        minSize: literal('44px'),
        actualSize: slotVar('field', '--dk-text-field-block-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'field',
      widths: [240, 320, 420],
      heights: [44, 48, 52],
      noOverflow: true,
      blockSize: slotVar('field', '--dk-text-field-block-size'),
      inlinePadding: slotVar('field', '--dk-text-field-inline-padding'),
      labelFontSize: slotVar('field', '--dk-text-field-input-font-size')
    },
    helperText: [
      {
        target: 'description',
        widths: [240, 320],
        fontSize: slotVar('description', '--dk-field-description-size'),
        maxLines: 2,
        sampleText: 'Use a project-specific name so the action stays easy to scan.'
      },
      {
        target: 'error',
        widths: [240, 320],
        fontSize: slotVar('error', '--dk-field-error-size'),
        maxLines: 2,
        sampleText: 'This field is required before you can continue.'
      }
    ]
  },
  proofCases: [
    { name: 'sizes', sampleText: 'Project name' },
    { name: 'invalid-md', axes: { size: 'md' }, states: ['invalid'], sampleText: 'Project name' },
    { name: 'disabled-sm', axes: { size: 'sm' }, states: ['disabled'], sampleText: 'Project name' }
  ],
  a11y: {
    role: 'textbox',
    keyboardModel: 'text-entry',
    labelling: 'external-label'
  }
});
