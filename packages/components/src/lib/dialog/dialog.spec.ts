import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type DialogSize = 'sm' | 'md' | 'lg';

export const dialogSpec: ComponentSpec = createComponentSpec({
  id: 'dialog',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'backdrop', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'title', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'footer', kind: 'container' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }],
  states: ['rest', 'open'],
  recipe: {
    root: [
      {
        style: {
          '--dk-motion-duration': ref('motion.normal')
        }
      }
    ],
    backdrop: [
      {
        style: {
          '--dk-dialog-backdrop-bg': literal('rgba(15, 23, 42, 0.45)')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-dialog-surface-bg': alias('overlay-bg'),
          '--dk-dialog-surface-fg': alias('overlay-fg'),
          '--dk-dialog-surface-border': alias('overlay-border'),
          '--dk-dialog-surface-radius': alias('overlay-radius'),
          '--dk-dialog-surface-shadow': alias('overlay-shadow'),
          '--dk-dialog-surface-width': literal('420px'),
          '--dk-dialog-surface-padding': ref('space.md')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-dialog-surface-width': literal('360px') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-dialog-surface-width': literal('560px'),
          '--dk-dialog-surface-padding': ref('space.lg')
        }
      }
    ],
    title: [
      {
        style: {
          '--dk-dialog-title-size': ref('type.md'),
          '--dk-dialog-title-weight': literal('650')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-dialog-description-size': ref('type.sm')
        }
      }
    ],
    footer: [
      {
        style: {
          '--dk-dialog-footer-gap': ref('space.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'surface',
        foreground: slotVar('surface', '--dk-dialog-surface-fg'),
        background: slotVar('surface', '--dk-dialog-surface-bg'),
        fontSize: literal(16),
        fontWeight: 500
      }
    ],
    layout: {
      target: 'surface',
      widths: [360, 420, 560],
      heights: [220, 320, 420],
      noOverflow: true,
      blockSize: literal('220px')
    }
  },
  proofCases: [{ name: 'default' }, { name: 'large', axes: { size: 'lg' } }],
  a11y: {
    role: 'dialog',
    keyboardModel: 'focus-trap',
    labelling: 'slot-label'
  }
});
