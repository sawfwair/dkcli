import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export const sideNavSpec: ComponentSpec = createComponentSpec({
  id: 'side-nav',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'item', kind: 'control', required: true },
    { name: 'label', kind: 'text', role: 'cta' },
    { name: 'badge', kind: 'text', role: 'meta' },
    { name: 'branch', kind: 'icon' }
  ],
  axes: [],
  states: ['rest', 'hover', 'focus-visible', 'open', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-side-nav-bg': alias('shell-nav-bg'),
          '--dk-side-nav-fg': alias('shell-nav-fg'),
          '--dk-side-nav-border': alias('shell-nav-border'),
          '--dk-side-nav-gap': literal('0.4rem'),
          '--dk-side-nav-padding': literal('0.75rem')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-side-nav-item-bg': alias('shell-nav-bg'),
          '--dk-side-nav-item-fg': alias('shell-nav-fg'),
          '--dk-side-nav-item-radius': alias('control-radius'),
          '--dk-side-nav-item-min-height': literal('44px'),
          '--dk-side-nav-item-inline-padding': literal('0.75rem')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-side-nav-item-bg': { ref: 'color.primary-container' },
          '--dk-side-nav-item-fg': { ref: 'color.on-primary-container' }
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-side-nav-label-size': literal('0.92rem'),
          '--dk-side-nav-label-weight': literal('600')
        }
      }
    ],
    badge: [
      {
        style: {
          '--dk-side-nav-badge-size': literal('0.75rem')
        }
      }
    ],
    branch: [
      {
        style: {
          '--dk-side-nav-branch-size': literal('0.85rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'item',
        foreground: slotVar('item', '--dk-side-nav-item-fg'),
        background: slotVar('item', '--dk-side-nav-item-bg'),
        fontSize: slotVar('label', '--dk-side-nav-label-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-side-nav-item-min-height'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [240, 320],
      heights: [320, 480],
      noOverflow: true,
      blockSize: slotVar('item', '--dk-side-nav-item-min-height')
    }
  },
  proofCases: [{ name: 'default' }, { name: 'selected', states: ['selected'] }],
  a11y: {
    role: 'navigation',
    keyboardModel: 'hierarchy',
    labelling: 'aria-label'
  }
});
