import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type ToastPlacement = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export const toastSpec: ComponentSpec = createComponentSpec({
  id: 'toast',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'item', kind: 'container', required: true },
    { name: 'title', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'body' },
    { name: 'action', kind: 'control' },
    { name: 'dismiss', kind: 'control' }
  ],
  axes: [{ name: 'placement', values: ['bottom-right', 'bottom-left', 'top-right', 'top-left'], default: 'bottom-right' }],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-toast-stack-gap': literal('0.75rem'),
          '--dk-toast-stack-inset': literal('1rem'),
          '--dk-motion-duration': ref('motion.normal')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-toast-item-bg': alias('floating-bg'),
          '--dk-toast-item-fg': alias('floating-fg'),
          '--dk-toast-item-border': alias('floating-border'),
          '--dk-toast-item-shadow': alias('floating-shadow'),
          '--dk-toast-item-radius': alias('overlay-radius'),
          '--dk-toast-item-padding': literal('1rem'),
          '--dk-toast-item-max-width': literal('320px')
        }
      }
    ],
    title: [
      {
        style: {
          '--dk-toast-title-size': literal('0.9375rem'),
          '--dk-toast-title-weight': literal('650')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-toast-description-size': literal('0.8125rem')
        }
      }
    ],
    action: [
      {
        style: {
          '--dk-toast-action-bg': alias('status-brand-bg'),
          '--dk-toast-action-fg': alias('status-brand-fg'),
          '--dk-toast-action-radius': ref('radius.pill'),
          '--dk-toast-action-inline-padding': literal('0.75rem'),
          '--dk-toast-action-block-size': literal('36px'),
          '--dk-toast-action-size': literal('0.8125rem')
        }
      }
    ],
    dismiss: [
      {
        style: {
          '--dk-toast-dismiss-size': literal('44px')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'item',
        foreground: slotVar('item', '--dk-toast-item-fg'),
        background: slotVar('item', '--dk-toast-item-bg'),
        fontSize: slotVar('title', '--dk-toast-title-size'),
        fontWeight: 650
      }
    ],
    target: [
      {
        target: 'dismiss',
        minSize: literal('44px'),
        actualSize: slotVar('dismiss', '--dk-toast-dismiss-size'),
        modality: 'touch'
      }
    ],
    anchoredSurface: [
      {
        target: 'item',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('item', '--dk-toast-item-max-width'),
        surfaceHeight: literal('120px'),
        offset: literal('16px'),
        viewportPadding: 16
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
    { name: 'toast-bottom-right', axes: { placement: 'bottom-right' } },
    { name: 'toast-top-left', axes: { placement: 'top-left' } }
  ],
  a11y: {
    role: 'status',
    labelling: 'external-label'
  }
});
