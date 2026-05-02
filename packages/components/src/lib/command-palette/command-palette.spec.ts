import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export const commandPaletteSpec: ComponentSpec = createComponentSpec({
  id: 'command-palette',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'backdrop', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'input', kind: 'control', required: true },
    { name: 'section', kind: 'text', role: 'meta' },
    { name: 'item', kind: 'control', required: true },
    { name: 'itemLabel', kind: 'text', role: 'cta' },
    { name: 'itemMeta', kind: 'text', role: 'meta' },
    { name: 'empty', kind: 'text', role: 'support' }
  ],
  axes: [],
  states: ['rest', 'hover', 'focus-visible', 'open', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-command-gap': literal('0.5rem'),
          '--dk-command-offset': literal('24px')
        }
      }
    ],
    backdrop: [
      {
        style: {
          '--dk-command-backdrop-bg': literal('color-mix(in srgb, black 42%, transparent)')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-command-surface-bg': alias('command-shell-bg'),
          '--dk-command-surface-fg': alias('command-shell-fg'),
          '--dk-command-surface-border': alias('command-shell-border'),
          '--dk-command-surface-shadow': alias('command-shell-shadow'),
          '--dk-command-surface-radius': alias('overlay-radius'),
          '--dk-command-surface-width': literal('min(42rem, calc(100vw - 2rem))'),
          '--dk-command-surface-max-height': literal('min(32rem, calc(100vh - 3rem))'),
          '--dk-command-surface-padding': literal('0.75rem')
        }
      }
    ],
    input: [
      {
        style: {
          '--dk-command-input-bg': alias('command-query-bg'),
          '--dk-command-input-fg': alias('command-query-fg'),
          '--dk-command-input-border': alias('command-query-border'),
          '--dk-command-input-radius': alias('control-radius'),
          '--dk-command-input-block-size': literal('48px'),
          '--dk-command-input-inline-padding': literal('0.875rem'),
          '--dk-command-input-font-size': literal('0.95rem')
        }
      }
    ],
    section: [
      {
        style: {
          '--dk-command-section-fg': alias('field-helper'),
          '--dk-command-section-size': literal('0.72rem')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-command-item-bg': alias('command-item-bg'),
          '--dk-command-item-fg': alias('command-item-fg'),
          '--dk-command-item-radius': alias('control-radius'),
          '--dk-command-item-min-height': literal('44px'),
          '--dk-command-item-inline-padding': literal('0.75rem')
        }
      },
      {
        match: { states: { hover: true } },
        style: {
          '--dk-command-item-bg': alias('command-item-highlight-bg'),
          '--dk-command-item-fg': alias('command-item-highlight-fg')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-command-item-bg': alias('command-item-highlight-bg'),
          '--dk-command-item-fg': alias('command-item-highlight-fg')
        }
      }
    ],
    itemLabel: [
      {
        style: {
          '--dk-command-item-label-size': literal('0.95rem'),
          '--dk-command-item-label-weight': literal('600')
        }
      }
    ],
    itemMeta: [
      {
        style: {
          '--dk-command-item-meta-fg': alias('field-helper'),
          '--dk-command-item-meta-size': literal('0.75rem')
        }
      }
    ],
    empty: [
      {
        style: {
          '--dk-command-empty-fg': alias('field-helper'),
          '--dk-command-empty-size': literal('0.9rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'input',
        foreground: slotVar('input', '--dk-command-input-fg'),
        background: slotVar('input', '--dk-command-input-bg'),
        fontSize: slotVar('input', '--dk-command-input-font-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'input',
        minSize: literal('44px'),
        actualSize: slotVar('input', '--dk-command-input-block-size'),
        modality: 'touch'
      }
    ],
    optionRow: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-command-item-min-height'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: literal('672px'),
        surfaceHeight: literal('512px'),
        offset: slotVar('root', '--dk-command-offset'),
        viewportPadding: 16
      }
    ]
  },
  proofCases: [{ name: 'default' }, { name: 'selected', states: ['selected'] }],
  a11y: {
    role: 'dialog',
    keyboardModel: 'list-navigation',
    labelling: 'aria-label'
  }
});
