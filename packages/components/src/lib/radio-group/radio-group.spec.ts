import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type RadioGroupSize = 'sm' | 'md' | 'lg';
export type RadioGroupOrientation = 'vertical' | 'horizontal';

export const radioGroupSpec: ComponentSpec = createComponentSpec({
  id: 'radio-group',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'legend', kind: 'text', role: 'support' },
    { name: 'item', kind: 'control', required: true },
    { name: 'control', kind: 'control', required: true },
    { name: 'mark', kind: 'control' },
    { name: 'itemLabel', kind: 'text', role: 'cta' },
    { name: 'itemDescription', kind: 'text', role: 'support' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' }
  ],
  axes: [
    { name: 'size', values: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'orientation', values: ['vertical', 'horizontal'], default: 'vertical' }
  ],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled', 'invalid'],
  recipe: {
    root: [
      {
        style: {
          '--dk-radio-group-gap': ref('space.sm'),
          '--dk-radio-group-item-gap': ref('space.xs'),
          '--dk-radio-group-hit-size': literal('44px')
        }
      }
    ],
    legend: [
      {
        style: {
          '--dk-radio-legend-color': alias('choice-fg'),
          '--dk-radio-legend-size': ref('type.sm'),
          '--dk-radio-legend-weight': literal('600')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-radio-item-gap': ref('space.xs')
        }
      }
    ],
    control: [
      {
        style: {
          '--dk-radio-control-bg': alias('choice-bg'),
          '--dk-radio-control-border': alias('choice-border'),
          '--dk-radio-control-size': literal('20px'),
          '--dk-radio-control-border-width': literal('1.5px'),
          '--dk-radio-focus-ring-color': alias('field-focus-ring')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-radio-control-size': literal('18px') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-radio-control-size': literal('22px') }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-radio-control-border': alias('choice-selected-border')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-radio-control-border': alias('field-error'),
          '--dk-radio-focus-ring-color': alias('field-error')
        }
      }
    ],
    mark: [
      {
        style: {
          '--dk-radio-mark-bg': alias('choice-selected-bg'),
          '--dk-radio-mark-size': literal('10px')
        }
      }
    ],
    itemLabel: [
      {
        style: {
          '--dk-radio-item-label-color': alias('choice-fg'),
          '--dk-radio-item-label-size': ref('type.sm'),
          '--dk-radio-item-label-weight': literal('600')
        }
      }
    ],
    itemDescription: [
      {
        style: {
          '--dk-radio-item-description-color': alias('field-helper'),
          '--dk-radio-item-description-size': ref('type.xs')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-radio-description-color': alias('field-helper'),
          '--dk-radio-description-size': ref('type.xs')
        }
      }
    ],
    error: [
      {
        style: {
          '--dk-radio-error-color': alias('field-error'),
          '--dk-radio-error-size': ref('type.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'control',
        foreground: slotVar('mark', '--dk-radio-mark-bg'),
        background: slotVar('control', '--dk-radio-control-bg'),
        fontSize: literal(16),
        fontWeight: 700
      }
    ],
    target: [
      {
        target: 'root',
        minSize: literal('44px'),
        actualSize: slotVar('root', '--dk-radio-group-hit-size'),
        modality: 'touch'
      }
    ],
    optionRow: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('root', '--dk-radio-group-hit-size'),
        modality: 'touch'
      }
    ]
  },
  proofCases: [
    { name: 'default' },
    { name: 'horizontal', axes: { orientation: 'horizontal' } },
    { name: 'selected', states: ['selected'] }
  ],
  a11y: {
    role: 'radiogroup',
    keyboardModel: 'selection-group',
    labelling: 'external-label'
  }
});
