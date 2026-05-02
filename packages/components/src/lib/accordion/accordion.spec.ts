import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type AccordionSize = 'sm' | 'md';

export const accordionSpec: ComponentSpec = createComponentSpec({
  id: 'accordion',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'item', kind: 'container', required: true },
    { name: 'trigger', kind: 'control', required: true },
    { name: 'indicator', kind: 'icon' },
    { name: 'label', kind: 'text', role: 'title' },
    { name: 'description', kind: 'text', role: 'support' },
    { name: 'panel', kind: 'container', role: 'body' }
  ],
  axes: [{ name: 'size', values: ['sm', 'md'], default: 'md' }],
  states: ['rest', 'open', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-accordion-gap': literal('0.75rem')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-accordion-gap': literal('0.5rem')
        }
      }
    ],
    item: [
      {
        style: {
          '--dk-accordion-item-bg': alias('display-card-bg'),
          '--dk-accordion-item-border': alias('display-card-border'),
          '--dk-accordion-item-border-width': literal('1px'),
          '--dk-accordion-item-radius': ref('radius.lg')
        }
      }
    ],
    trigger: [
      {
        style: {
          '--dk-accordion-trigger-bg': alias('display-card-bg'),
          '--dk-accordion-trigger-fg': alias('display-card-fg'),
          '--dk-accordion-trigger-bg-open': alias('nav-current-bg'),
          '--dk-accordion-trigger-fg-open': ref('color.on-primary-container'),
          '--dk-accordion-trigger-fg-disabled': alias('nav-disabled-fg'),
          '--dk-accordion-trigger-gap': literal('0.75rem'),
          '--dk-accordion-trigger-inline-padding': literal('1rem'),
          '--dk-accordion-trigger-block-size': literal('48px'),
          '--dk-accordion-trigger-size': literal('1rem'),
          '--dk-accordion-trigger-weight': literal('650')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-accordion-trigger-block-size': literal('44px'),
          '--dk-accordion-trigger-inline-padding': literal('0.875rem'),
          '--dk-accordion-trigger-size': literal('0.875rem')
        }
      }
    ],
    indicator: [
      {
        style: {
          '--dk-accordion-indicator-size': literal('1rem'),
          '--dk-accordion-indicator-color': alias('nav-current-fg'),
          '--dk-accordion-indicator-color-open': ref('color.on-primary-container')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-accordion-label-color': literal('inherit'),
          '--dk-accordion-label-size': literal('inherit'),
          '--dk-accordion-label-weight': literal('inherit')
        }
      }
    ],
    description: [
      {
        style: {
          '--dk-accordion-description-color': alias('display-card-muted'),
          '--dk-accordion-description-size': literal('0.8125rem')
        }
      }
    ],
    panel: [
      {
        style: {
          '--dk-accordion-panel-bg': ref('color.surface'),
          '--dk-accordion-panel-fg': ref('color.on-surface'),
          '--dk-accordion-panel-padding': literal('1rem'),
          '--dk-accordion-panel-size': literal('0.9375rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'trigger',
        foreground: slotVar('trigger', '--dk-accordion-trigger-fg'),
        background: slotVar('trigger', '--dk-accordion-trigger-bg'),
        fontSize: slotVar('trigger', '--dk-accordion-trigger-size'),
        fontWeight: 650
      },
      {
        target: 'panel',
        foreground: slotVar('panel', '--dk-accordion-panel-fg'),
        background: slotVar('panel', '--dk-accordion-panel-bg'),
        fontSize: slotVar('panel', '--dk-accordion-panel-size'),
        fontWeight: 500
      }
    ],
    target: [
      {
        target: 'trigger',
        minSize: literal('44px'),
        actualSize: slotVar('trigger', '--dk-accordion-trigger-block-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'panel',
      widths: [320, 420],
      heights: [160],
      noOverflow: true,
      blockSize: literal('128px'),
      inlinePadding: slotVar('panel', '--dk-accordion-panel-padding'),
      gap: slotVar('trigger', '--dk-accordion-trigger-gap'),
      labelFontSize: slotVar('trigger', '--dk-accordion-trigger-size'),
      iconSize: slotVar('indicator', '--dk-accordion-indicator-size')
    }
  },
  proofCases: [
    {
      name: 'accordion-sm',
      axes: { size: 'sm' },
      sampleText: 'Overview and rollout checklist'
    },
    {
      name: 'accordion-md-open',
      axes: { size: 'md' },
      states: ['open'],
      sampleText: 'Deployment timeline and stakeholder notes'
    }
  ],
  a11y: {
    role: 'region',
    labelling: 'external-label'
  }
});
