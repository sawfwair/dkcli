import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type StepperSize = 'sm' | 'md';
export type StepperOrientation = 'horizontal' | 'vertical';

export const stepperSpec: ComponentSpec = createComponentSpec({
  id: 'stepper',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'track', kind: 'container', required: true },
    { name: 'item', kind: 'control', required: true },
    { name: 'indicator', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' }
  ],
  axes: [
    { name: 'size', values: ['sm', 'md'], default: 'md' },
    { name: 'orientation', values: ['horizontal', 'vertical'], default: 'horizontal' }
  ],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-stepper-gap': ref('space.sm')
        }
      }
    ],
    track: [
      {
        style: {
          '--dk-stepper-track-color': alias('stepper-track'),
          '--dk-stepper-track-thickness': literal('2px'),
          '--dk-stepper-track-gap': ref('space.sm')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-stepper-item-bg': ref('color.surface'),
          '--dk-stepper-item-fg': ref('color.on-surface'),
          '--dk-stepper-item-radius': alias('control-radius'),
          '--dk-stepper-item-block-size': literal('44px'),
          '--dk-stepper-item-inline-padding': ref('space.sm')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-stepper-item-bg': ref('color.primary-container'),
          '--dk-stepper-item-fg': ref('color.on-primary-container')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-stepper-item-fg': alias('nav-disabled-fg')
        }
      }
    ],
    indicator: [
      {
        style: {
          '--dk-stepper-indicator-bg': alias('stepper-upcoming'),
          '--dk-stepper-indicator-fg': alias('surface-fg'),
          '--dk-stepper-indicator-size': literal('1.5rem')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-stepper-indicator-bg': alias('stepper-current'),
          '--dk-stepper-indicator-fg': alias('on-primary')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-stepper-label-size': ref('type.sm'),
          '--dk-stepper-label-weight': literal('650')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-stepper-label-size': ref('type.xs')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-stepper-description-size': ref('type.xs'),
          '--dk-stepper-description-color': alias('field-helper')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'label',
        foreground: slotVar('item', '--dk-stepper-item-fg'),
        background: slotVar('item', '--dk-stepper-item-bg'),
        fontSize: slotVar('label', '--dk-stepper-label-size'),
        fontWeight: 650,
        minLc: 30
      }
    ],
    target: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-stepper-item-block-size'),
        modality: 'touch'
      }
    ]
  },
  proofCases: [
    { name: 'horizontal-md', axes: { size: 'md', orientation: 'horizontal' } },
    { name: 'vertical-sm', axes: { size: 'sm', orientation: 'vertical' } },
    { name: 'selected-md', axes: { size: 'md', orientation: 'horizontal' }, states: ['selected'] }
  ],
  a11y: {
    role: 'navigation',
    keyboardModel: 'stepper',
    labelling: 'external-label'
  }
});
