import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type BreadcrumbsSize = 'sm' | 'md';

export const breadcrumbsSpec: ComponentSpec = createComponentSpec({
  id: 'breadcrumbs',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'item', kind: 'text', role: 'meta' },
    { name: 'separator', kind: 'icon' },
    { name: 'current', kind: 'text', role: 'meta' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md'], default: 'md' }],
  states: ['rest', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-breadcrumbs-gap': literal('0.5rem')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-breadcrumbs-item-fg': alias('nav-item-fg'),
          '--dk-breadcrumbs-item-size': literal('0.875rem'),
          '--dk-breadcrumbs-item-block-size': literal('44px'),
          '--dk-breadcrumbs-item-inline-padding': literal('0.5rem'),
          '--dk-breadcrumbs-item-radius': ref('radius.pill')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-breadcrumbs-item-size': literal('0.75rem')
        }
      }
    ],
    separator: [
      {
        style: {
          '--dk-breadcrumbs-separator-fg': alias('nav-separator-fg'),
          '--dk-breadcrumbs-separator-size': literal('0.75rem')
        }
      }
    ],
    current: [
      {
        style: {
          '--dk-breadcrumbs-current-bg': alias('nav-current-bg'),
          '--dk-breadcrumbs-current-fg': ref('color.on-primary-container'),
          '--dk-breadcrumbs-current-size': literal('0.875rem'),
          '--dk-breadcrumbs-current-inline-padding': literal('0.625rem'),
          '--dk-breadcrumbs-current-radius': ref('radius.pill')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-breadcrumbs-current-size': literal('0.75rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'current',
        foreground: slotVar('current', '--dk-breadcrumbs-current-fg'),
        background: slotVar('current', '--dk-breadcrumbs-current-bg'),
        fontSize: slotVar('current', '--dk-breadcrumbs-current-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'item',
        minSize: literal('44px'),
        actualSize: slotVar('item', '--dk-breadcrumbs-item-block-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [220, 320],
      heights: [48],
      noOverflow: true,
      blockSize: slotVar('item', '--dk-breadcrumbs-item-block-size'),
      inlinePadding: slotVar('item', '--dk-breadcrumbs-item-inline-padding'),
      gap: slotVar('root', '--dk-breadcrumbs-gap'),
      labelFontSize: slotVar('item', '--dk-breadcrumbs-item-size'),
      iconSize: slotVar('separator', '--dk-breadcrumbs-separator-size')
    }
  },
  proofCases: [
    {
      name: 'breadcrumbs-md',
      axes: { size: 'md' },
      sampleText: 'Workspace / Release / Production'
    }
  ],
  a11y: {
    role: 'navigation',
    labelling: 'external-label'
  }
});
