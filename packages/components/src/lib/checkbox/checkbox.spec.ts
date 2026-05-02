import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type CheckboxSize = 'sm' | 'md' | 'lg';

export const checkboxSpec: ComponentSpec = createComponentSpec({
  id: 'checkbox',
  slots: [
    { name: 'root', kind: 'control', required: true },
    { name: 'control', kind: 'control', required: true },
    { name: 'mark', kind: 'icon' },
    { name: 'label', kind: 'text', role: 'cta' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'checked', 'indeterminate', 'disabled', 'invalid'],
  recipe: {
    root: [
      {
        style: {
          '--dk-checkbox-gap': ref('space.xs'),
          '--dk-checkbox-hit-size': literal('44px'),
          '--dk-checkbox-copy-gap': literal('0.22rem'),
          '--dk-checkbox-motion-duration': ref('motion.normal'),
          '--dk-motion-duration': ref('motion.normal')
        }
      }
    ],
    control: [
      {
        style: {
          '--dk-checkbox-bg': alias('choice-bg'),
          '--dk-checkbox-border': alias('choice-border'),
          '--dk-checkbox-border-width': literal('1.5px'),
          '--dk-checkbox-size': literal('20px'),
          '--dk-checkbox-radius': literal('0.45rem'),
          '--dk-checkbox-shadow': literal('none'),
          '--dk-checkbox-focus-ring-color': alias('field-focus-ring')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-checkbox-size': literal('18px') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-checkbox-size': literal('22px') }
      },
      {
        match: { states: { hover: true } },
        style: { '--dk-checkbox-bg': ref('color.surface-bright') }
      },
      {
        match: { states: { checked: true } },
        style: {
          '--dk-checkbox-bg': alias('choice-selected-bg'),
          '--dk-checkbox-border': alias('choice-selected-border')
        }
      },
      {
        match: { states: { indeterminate: true } },
        style: {
          '--dk-checkbox-bg': alias('choice-selected-bg'),
          '--dk-checkbox-border': alias('choice-selected-border')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-checkbox-bg': ref('color.surface-dim'),
          '--dk-checkbox-border': ref('color.outline')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-checkbox-border': alias('field-error'),
          '--dk-checkbox-focus-ring-color': alias('field-error')
        }
      }
    ],
    mark: [
      {
        style: {
          '--dk-checkbox-mark-color': alias('choice-selected-fg'),
          '--dk-checkbox-mark-size': literal('0.82rem')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-checkbox-label-color': alias('choice-fg'),
          '--dk-checkbox-label-size': ref('type.sm'),
          '--dk-checkbox-label-weight': literal('600')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-checkbox-description-color': alias('field-helper'),
          '--dk-checkbox-description-size': literal('0.8125rem')
        }
      }
    ],
    error: [
      {
        style: {
          '--dk-checkbox-error-color': alias('field-error'),
          '--dk-checkbox-error-size': literal('0.8125rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'control',
        foreground: alias('choice-selected-fg'),
        background: alias('choice-selected-bg'),
        fontSize: literal(16),
        fontWeight: 700,
        minLc: 30
      }
    ],
    target: [
      {
        target: 'root',
        minSize: literal('44px'),
        actualSize: slotVar('root', '--dk-checkbox-hit-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [240, 320],
      heights: [44],
      noOverflow: true,
      blockSize: slotVar('root', '--dk-checkbox-hit-size'),
      gap: slotVar('root', '--dk-checkbox-gap'),
      labelFontSize: slotVar('label', '--dk-checkbox-label-size')
    },
    helperText: [
      {
        target: 'description',
        widths: [240, 320],
        fontSize: slotVar('description', '--dk-checkbox-description-size'),
        maxLines: 2,
        sampleText: 'Use this when the user can opt into a secondary behavior.'
      }
    ]
  },
  proofCases: [
    { name: 'default', sampleText: 'Send release notes' },
    { name: 'checked', states: ['checked'], sampleText: 'Send release notes' },
    { name: 'indeterminate', states: ['indeterminate'], sampleText: 'Send release notes' }
  ],
  a11y: {
    role: 'checkbox',
    keyboardModel: 'toggle',
    labelling: 'slot-label'
  }
});
