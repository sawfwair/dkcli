import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });
const onColor = (value: TokenExpr): TokenExpr => ({ onColor: value });

export type RangeDatePickerSize = 'sm' | 'md' | 'lg';

export const rangeDatePickerSpec: ComponentSpec = createComponentSpec({
  id: 'range-date-picker',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'label', kind: 'text', role: 'support' },
    { name: 'trigger', kind: 'control', required: true },
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
          '--dk-range-gap': literal('0.5rem'),
          '--dk-range-offset': literal('8px')
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
          '--dk-range-trigger-bg': alias('calendar-trigger-bg'),
          '--dk-range-trigger-fg': alias('calendar-trigger-fg'),
          '--dk-range-trigger-border': alias('calendar-trigger-border'),
          '--dk-range-trigger-radius': alias('control-radius'),
          '--dk-range-trigger-block-size': literal('48px'),
          '--dk-range-trigger-inline-padding': ref('space.sm'),
          '--dk-range-trigger-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-range-trigger-block-size': literal('44px'),
          '--dk-range-trigger-font-size': ref('type.xs')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-range-trigger-block-size': literal('52px'),
          '--dk-range-trigger-inline-padding': ref('space.md'),
          '--dk-range-trigger-font-size': ref('type.md')
        }
      },
      {
        match: { states: { invalid: true } },
        style: {
          '--dk-range-trigger-border': alias('field-error')
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
          '--dk-range-surface-bg': alias('calendar-surface-bg'),
          '--dk-range-surface-fg': alias('calendar-surface-fg'),
          '--dk-range-surface-border': alias('calendar-surface-border'),
          '--dk-range-surface-radius': alias('overlay-radius'),
          '--dk-range-surface-shadow': alias('calendar-surface-shadow'),
          '--dk-range-surface-width': literal('720px'),
          '--dk-range-surface-padding': ref('space.sm')
        }
      }
    ],
    caption: [
      {
        style: {
          '--dk-range-caption-color': alias('calendar-caption-fg'),
          '--dk-range-caption-size': ref('type.sm'),
          '--dk-range-caption-weight': literal('700')
        }
      }
    ],
    navButton: [
      {
        style: {
          '--dk-range-nav-bg': alias('calendar-nav-bg'),
          '--dk-range-nav-fg': alias('calendar-nav-fg'),
          '--dk-range-nav-size': literal('36px')
        }
      }
    ],
    weekday: [
      {
        style: {
          '--dk-range-weekday-color': alias('calendar-weekday-fg'),
          '--dk-range-weekday-size': ref('type.xs')
        }
      }
    ],
    day: [
      {
        style: {
          '--dk-range-day-bg': alias('range-day-bg'),
          '--dk-range-day-fg': alias('range-day-fg'),
          '--dk-range-day-selected-bg': alias('range-day-selected-bg'),
          '--dk-range-day-selected-fg': onColor(alias('range-day-selected-bg')),
          '--dk-range-day-between-bg': alias('range-day-between-bg'),
          '--dk-range-day-between-fg': alias('range-day-between-fg'),
          '--dk-range-day-disabled-fg': alias('calendar-day-disabled-fg'),
          '--dk-range-day-outside-fg': alias('calendar-day-outside-fg'),
          '--dk-range-day-radius': alias('control-radius'),
          '--dk-range-day-target': literal('44px'),
          '--dk-range-day-size': ref('type.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'trigger',
        foreground: slotVar('trigger', '--dk-range-trigger-fg'),
        background: slotVar('trigger', '--dk-range-trigger-bg'),
        fontSize: slotVar('trigger', '--dk-range-trigger-font-size'),
        fontWeight: 500
      },
      {
        target: 'day',
        foreground: slotVar('day', '--dk-range-day-selected-fg'),
        background: slotVar('day', '--dk-range-day-selected-bg'),
        fontSize: slotVar('day', '--dk-range-day-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'trigger',
        minSize: literal('44px'),
        actualSize: slotVar('trigger', '--dk-range-trigger-block-size'),
        modality: 'touch'
      },
      {
        target: 'day',
        minSize: literal('44px'),
        actualSize: slotVar('day', '--dk-range-day-target'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-range-surface-width'),
        surfaceHeight: literal('360px'),
        offset: slotVar('root', '--dk-range-offset'),
        viewportPadding: 16
      }
    ],
    layout: {
      target: 'surface',
      widths: [560, 720],
      heights: [360, 420],
      noOverflow: true,
      blockSize: literal('360px')
    }
  },
  proofCases: [{ name: 'default-md' }, { name: 'lg', axes: { size: 'lg' } }],
  a11y: {
    role: 'group',
    keyboardModel: 'calendar-grid',
    labelling: 'external-label'
  }
});
