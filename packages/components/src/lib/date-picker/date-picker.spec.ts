import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });
const onColor = (value: TokenExpr): TokenExpr => ({ onColor: value });

export type DatePickerSize = 'sm' | 'md' | 'lg';

export const datePickerSpec: ComponentSpec = createComponentSpec({
  id: 'date-picker',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'trigger', kind: 'control', required: true },
    { name: 'icon', kind: 'icon' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'error', kind: 'text', role: 'support' },
    { name: 'surface', kind: 'container', required: true },
    { name: 'caption', kind: 'text', role: 'title' },
    { name: 'navButton', kind: 'control' },
    { name: 'weekday', kind: 'text', role: 'meta' },
    { name: 'day', kind: 'control', required: true }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'hover', 'focus-visible', 'open', 'selected', 'disabled', 'invalid'],
  recipe: {
    root: [
      {
        style: {
          '--dk-field-stack-gap': literal('0.45rem'),
          '--dk-date-picker-offset': literal('8px'),
          '--dk-motion-duration': ref('motion.normal')
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
          '--dk-date-picker-trigger-bg': alias('calendar-trigger-bg'),
          '--dk-date-picker-trigger-fg': alias('calendar-trigger-fg'),
          '--dk-date-picker-trigger-border': alias('calendar-trigger-border'),
          '--dk-date-picker-trigger-radius': alias('control-radius'),
          '--dk-date-picker-trigger-block-size': literal('48px'),
          '--dk-date-picker-trigger-inline-padding': ref('space.sm'),
          '--dk-date-picker-trigger-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-date-picker-trigger-block-size': literal('44px'),
          '--dk-date-picker-trigger-font-size': ref('type.xs')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-date-picker-trigger-block-size': literal('52px'),
          '--dk-date-picker-trigger-inline-padding': ref('space.md'),
          '--dk-date-picker-trigger-font-size': ref('type.md')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-date-picker-trigger-border': alias('field-error')
        }
      },
      {
        match: { states: { open: true, 'focus-visible': true } },
        style: {
          '--dk-date-picker-trigger-border': alias('field-focus-ring')
        }
      }
    ],
    icon: [
      {
        style: {
          '--dk-date-picker-icon-size': literal('1rem'),
          '--dk-date-picker-icon-color': alias('field-helper')
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
          '--dk-date-picker-surface-bg': alias('calendar-surface-bg'),
          '--dk-date-picker-surface-fg': alias('calendar-surface-fg'),
          '--dk-date-picker-surface-border': alias('calendar-surface-border'),
          '--dk-date-picker-surface-radius': alias('overlay-radius'),
          '--dk-date-picker-surface-shadow': alias('calendar-surface-shadow'),
          '--dk-date-picker-surface-width': literal('320px'),
          '--dk-date-picker-surface-padding': ref('space.sm')
        }
      }
    ],
    caption: [
      {
        style: {
          '--dk-date-picker-caption-color': alias('calendar-caption-fg'),
          '--dk-date-picker-caption-size': ref('type.sm'),
          '--dk-date-picker-caption-weight': literal('700')
        }
      }
    ],
    navButton: [
      {
        style: {
          '--dk-date-picker-nav-bg': alias('calendar-nav-bg'),
          '--dk-date-picker-nav-fg': alias('calendar-nav-fg'),
          '--dk-date-picker-nav-size': literal('36px')
        }
      }
    ],
    weekday: [
      {
        style: {
          '--dk-date-picker-weekday-color': alias('calendar-weekday-fg'),
          '--dk-date-picker-weekday-size': ref('type.xs')
        }
      }
    ],
    day: [
      {
        style: {
          '--dk-date-picker-day-bg': alias('calendar-day-bg'),
          '--dk-date-picker-day-fg': alias('calendar-day-fg'),
          '--dk-date-picker-day-radius': alias('control-radius'),
          '--dk-date-picker-day-size': ref('type.xs'),
          '--dk-date-picker-day-target': literal('44px'),
          '--dk-date-picker-day-today-ring': alias('calendar-day-today-ring'),
          '--dk-date-picker-day-disabled-fg': alias('calendar-day-disabled-fg'),
          '--dk-date-picker-day-outside-fg': alias('calendar-day-outside-fg')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-date-picker-day-bg': alias('calendar-day-selected-bg'),
          '--dk-date-picker-day-fg': onColor(alias('calendar-day-selected-bg'))
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-date-picker-day-fg': alias('calendar-day-disabled-fg')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'trigger',
        foreground: slotVar('trigger', '--dk-date-picker-trigger-fg'),
        background: slotVar('trigger', '--dk-date-picker-trigger-bg'),
        fontSize: slotVar('trigger', '--dk-date-picker-trigger-font-size'),
        fontWeight: 500
      },
      {
        target: 'day',
        foreground: slotVar('day', '--dk-date-picker-day-fg'),
        background: slotVar('day', '--dk-date-picker-day-bg'),
        fontSize: slotVar('day', '--dk-date-picker-day-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'trigger',
        minSize: literal('44px'),
        actualSize: slotVar('trigger', '--dk-date-picker-trigger-block-size'),
        modality: 'touch'
      },
      {
        target: 'day',
        minSize: literal('44px'),
        actualSize: slotVar('day', '--dk-date-picker-day-target'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-date-picker-surface-width'),
        surfaceHeight: literal('324px'),
        offset: slotVar('root', '--dk-date-picker-offset'),
        viewportPadding: 16
      }
    ],
    layout: {
      target: 'surface',
      widths: [280, 320, 360],
      heights: [324, 360],
      noOverflow: true,
      blockSize: literal('324px')
    }
  },
  proofCases: [
    { name: 'default-md', axes: { size: 'md' } },
    { name: 'selected-lg', axes: { size: 'lg' }, states: ['selected'] },
    { name: 'disabled-sm', axes: { size: 'sm' }, states: ['disabled'] }
  ],
  a11y: {
    role: 'group',
    keyboardModel: 'calendar-grid',
    labelling: 'external-label'
  }
});
