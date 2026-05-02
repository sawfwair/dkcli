import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type SwitchSize = 'sm' | 'md' | 'lg';

export const switchSpec: ComponentSpec = createComponentSpec({
  id: 'switch',
  slots: [
    { name: 'root', kind: 'control', required: true },
    { name: 'track', kind: 'control', required: true },
    { name: 'thumb', kind: 'control', required: true },
    { name: 'label', kind: 'text', role: 'cta' },
    { name: 'description', kind: 'text', role: 'support' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'checked', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-switch-gap': ref('space.xs'),
          '--dk-switch-hit-size': literal('44px'),
          '--dk-motion-duration': ref('motion.normal')
        }
      }
    ],
    track: [
      {
        style: {
          '--dk-switch-track-bg': alias('choice-track'),
          '--dk-switch-track-width': literal('42px'),
          '--dk-switch-track-height': literal('24px'),
          '--dk-switch-track-radius': literal('999px'),
          '--dk-switch-thumb-offset': literal('2px'),
          '--dk-switch-focus-ring-color': alias('field-focus-ring')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-switch-track-width': literal('38px'),
          '--dk-switch-track-height': literal('22px')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-switch-track-width': literal('48px'),
          '--dk-switch-track-height': literal('28px')
        }
      },
      {
        match: { states: { checked: true } },
        style: {
          '--dk-switch-track-bg': alias('choice-selected-bg')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-switch-track-bg': ref('color.outline')
        }
      }
    ],
    thumb: [
      {
        style: {
          '--dk-switch-thumb-bg': alias('choice-thumb'),
          '--dk-switch-thumb-size': literal('20px')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-switch-thumb-size': literal('18px') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-switch-thumb-size': literal('24px') }
      },
      {
        match: { states: { checked: true } },
        style: { '--dk-switch-thumb-bg': alias('choice-selected-fg') }
      }
    ],
    label: [
      {
        style: {
          '--dk-switch-label-color': alias('choice-fg'),
          '--dk-switch-label-size': ref('type.sm'),
          '--dk-switch-label-weight': literal('600')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-switch-description-color': alias('field-helper'),
          '--dk-switch-description-size': ref('type.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'track',
        foreground: slotVar('thumb', '--dk-switch-thumb-bg'),
        background: slotVar('track', '--dk-switch-track-bg'),
        fontSize: literal(16),
        fontWeight: 700,
        minLc: 30
      }
    ],
    target: [
      {
        target: 'root',
        minSize: literal('44px'),
        actualSize: slotVar('root', '--dk-switch-hit-size'),
        modality: 'touch'
      }
    ],
    motion: [
      {
        target: 'root',
        durationMaxMs: 320
      }
    ]
  },
  proofCases: [
    { name: 'default' },
    { name: 'checked', states: ['checked'] }
  ],
  a11y: {
    role: 'switch',
    keyboardModel: 'toggle',
    labelling: 'slot-label'
  }
});
