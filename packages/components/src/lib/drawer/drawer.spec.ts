import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type DrawerSize = 'sm' | 'md' | 'lg';
export type DrawerSide = 'left' | 'right';

export const drawerSpec: ComponentSpec = createComponentSpec({
  id: 'drawer',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'backdrop', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'title', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'footer', kind: 'container' }
  ],
  axes: [
    { name: 'size', values: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'side', values: ['left', 'right'], default: 'right' }
  ],
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
          '--dk-drawer-backdrop-bg': literal('rgba(15, 23, 42, 0.45)')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-drawer-surface-bg': alias('overlay-bg'),
          '--dk-drawer-surface-fg': alias('overlay-fg'),
          '--dk-drawer-surface-border': alias('overlay-border'),
          '--dk-drawer-surface-radius': alias('overlay-radius'),
          '--dk-drawer-surface-shadow': alias('overlay-shadow'),
          '--dk-drawer-surface-width': literal('360px'),
          '--dk-drawer-surface-padding': ref('space.md')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-drawer-surface-width': literal('420px')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-drawer-surface-width': literal('520px'),
          '--dk-drawer-surface-padding': ref('space.lg')
        }
      }
    ],
    title: [
      {
        style: {
          '--dk-drawer-title-size': ref('type.md'),
          '--dk-drawer-title-weight': literal('650')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-drawer-description-size': ref('type.sm')
        }
      }
    ],
    footer: [
      {
        style: {
          '--dk-drawer-footer-gap': ref('space.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'surface',
        foreground: slotVar('surface', '--dk-drawer-surface-fg'),
        background: slotVar('surface', '--dk-drawer-surface-bg'),
        fontSize: literal(16),
        fontWeight: 500
      }
    ],
    layout: {
      target: 'surface',
      widths: [360, 420, 520],
      heights: [420, 540, 640],
      noOverflow: true,
      blockSize: literal('420px')
    }
  },
  proofCases: [
    { name: 'default-right' },
    { name: 'large-left', axes: { size: 'lg', side: 'left' } }
  ],
  a11y: {
    role: 'dialog',
    keyboardModel: 'focus-trap',
    labelling: 'slot-label'
  }
});
