import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type TabsSize = 'sm' | 'md' | 'lg';
export type TabsOrientation = 'horizontal' | 'vertical';

export const tabsSpec: ComponentSpec = createComponentSpec({
  id: 'tabs',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'list', kind: 'container', required: true },
    { name: 'trigger', kind: 'control', required: true },
    { name: 'indicator', kind: 'control' },
    { name: 'panel', kind: 'container' }
  ],
  axes: [
    { name: 'size', values: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'orientation', values: ['horizontal', 'vertical'], default: 'horizontal' }
  ],
  states: ['rest', 'hover', 'focus-visible', 'selected', 'disabled'],
  recipe: {
    root: [
      {
        style: {
          '--dk-tabs-gap': ref('space.sm')
        }
      }
    ],
    list: [
      {
        style: {
          '--dk-tabs-list-gap': ref('space.2xs'),
          '--dk-tabs-list-bg': ref('color.surface-dim'),
          '--dk-tabs-list-radius': alias('control-radius')
        }
      }
    ],
    trigger: [
      {
        style: {
          '--dk-tabs-trigger-bg': literal('transparent'),
          '--dk-tabs-trigger-fg': alias('tab-inactive-fg'),
          '--dk-tabs-trigger-radius': alias('control-radius'),
          '--dk-tabs-trigger-block-size': literal('36px'),
          '--dk-tabs-trigger-inline-padding': ref('space.sm'),
          '--dk-tabs-trigger-font-size': ref('type.xs'),
          '--dk-tabs-trigger-font-weight': literal('600'),
          '--dk-tabs-trigger-motion-duration': ref('motion.normal')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-tabs-trigger-block-size': literal('32px'),
          '--dk-tabs-trigger-inline-padding': ref('space.xs'),
          '--dk-tabs-trigger-font-size': ref('type.xs')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-tabs-trigger-block-size': literal('44px'),
          '--dk-tabs-trigger-inline-padding': ref('space.md'),
          '--dk-tabs-trigger-font-size': ref('type.sm')
        }
      },
      {
        match: { states: { hover: true } },
        style: {
          '--dk-tabs-trigger-bg': ref('color.surface-bright')
        }
      },
      {
        match: { states: { selected: true } },
        style: {
          '--dk-tabs-trigger-bg': ref('color.surface'),
          '--dk-tabs-trigger-fg': ref('color.on-surface')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-tabs-trigger-fg': ref('color.outline')
        }
      }
    ],
    indicator: [
      {
        style: {
          '--dk-tabs-indicator-bg': alias('tab-indicator'),
          '--dk-tabs-indicator-thickness': literal('2px')
        }
      }
    ],
    panel: [
      {
        style: {
          '--dk-tabs-panel-bg': ref('color.surface'),
          '--dk-tabs-panel-fg': ref('color.on-surface'),
          '--dk-tabs-panel-radius': alias('control-radius'),
          '--dk-tabs-panel-padding': ref('space.md')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'trigger',
        foreground: slotVar('trigger', '--dk-tabs-trigger-fg'),
        background: slotVar('list', '--dk-tabs-list-bg'),
        fontSize: slotVar('trigger', '--dk-tabs-trigger-font-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'trigger',
        minSize: literal('32px'),
        actualSize: slotVar('trigger', '--dk-tabs-trigger-block-size'),
        modality: 'mouse'
      }
    ]
  },
  proofCases: [
    { name: 'horizontal-default' },
    { name: 'vertical-default', axes: { orientation: 'vertical' } },
    { name: 'selected', states: ['selected'] }
  ],
  a11y: {
    role: 'tablist',
    keyboardModel: 'selection-group',
    labelling: 'external-label'
  }
});
