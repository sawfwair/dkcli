import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type PopoverSize = 'sm' | 'md' | 'lg';

export const popoverSpec: ComponentSpec = createComponentSpec({
  id: 'popover',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'content', kind: 'container' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'open'],
  recipe: {
    root: [
      {
        style: {
          '--dk-motion-duration': ref('motion.normal'),
          '--dk-popover-offset': literal('12px')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-popover-surface-bg': alias('overlay-bg'),
          '--dk-popover-surface-fg': alias('overlay-fg'),
          '--dk-popover-surface-border': alias('overlay-border'),
          '--dk-popover-surface-radius': alias('overlay-radius'),
          '--dk-popover-surface-shadow': alias('overlay-shadow'),
          '--dk-popover-surface-width': literal('260px'),
          '--dk-popover-surface-padding': ref('space.md')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-popover-surface-width': literal('220px') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-popover-surface-width': literal('320px') }
      }
    ],
    content: [
      {
        style: {
          '--dk-popover-content-size': ref('type.sm')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'surface',
        foreground: slotVar('surface', '--dk-popover-surface-fg'),
        background: slotVar('surface', '--dk-popover-surface-bg'),
        fontSize: slotVar('content', '--dk-popover-content-size'),
        fontWeight: 500
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-popover-surface-width'),
        surfaceHeight: literal('220px'),
        offset: slotVar('root', '--dk-popover-offset'),
        viewportPadding: 16
      }
    ]
  },
  proofCases: [{ name: 'default' }, { name: 'large', axes: { size: 'lg' } }],
  a11y: {
    role: 'dialog',
    keyboardModel: 'dismissable-layer',
    labelling: 'external-label'
  }
});
