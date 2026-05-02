import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonContentMode = 'label' | 'leading' | 'trailing' | 'leading-trailing' | 'icon-only';

export const buttonSpec: ComponentSpec = createComponentSpec({
  id: 'button',
  slots: [
    { name: 'root', kind: 'control', required: true },
    { name: 'label', kind: 'text', role: 'cta' },
    { name: 'leading', kind: 'icon' },
    { name: 'trailing', kind: 'icon' },
    { name: 'icon', kind: 'icon' },
    { name: 'spinner', kind: 'icon' }
  ],
  axes: [
    { name: 'variant', values: ['solid', 'soft', 'outline', 'ghost', 'link', 'destructive'], default: 'solid' },
    { name: 'size', values: ['xs', 'sm', 'md', 'lg'], default: 'md' },
    { name: 'content', values: ['label', 'leading', 'trailing', 'leading-trailing', 'icon-only'], default: 'label' }
  ],
  states: ['rest', 'hover', 'focus-visible', 'pressed', 'disabled', 'loading'],
  recipe: {
    root: [
      {
        style: {
          '--dk-button-bg': ref('surface'),
          '--dk-button-fg': ref('on-surface'),
          '--dk-button-border': ref('outline'),
          '--dk-button-border-width': literal('1px'),
          '--dk-button-radius': alias('control-radius'),
          '--dk-button-min-size': literal('44px'),
          '--dk-button-block-size': literal('48px'),
          '--dk-button-inline-padding': ref('space.sm'),
          '--dk-button-gap': ref('space.2xs'),
          '--dk-button-shadow': literal('none'),
          '--dk-button-focus-ring-color': ref('primary'),
          '--dk-button-focus-ring-width': literal('3px'),
          '--dk-button-focus-ring-offset': literal('2px'),
          '--dk-button-translate-y': literal('0px'),
          '--dk-button-opacity': literal('1'),
          '--dk-button-loading-opacity': literal('0.82'),
          '--dk-button-cursor': literal('pointer'),
          '--dk-button-transition-duration': ref('motion.normal')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-button-block-size': literal('44px'),
          '--dk-button-inline-padding': ref('space.xs'),
          '--dk-button-gap': ref('space.2xs')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-button-block-size': literal('44px'),
          '--dk-button-inline-padding': ref('space.sm'),
          '--dk-button-gap': ref('space.2xs')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-button-block-size': literal('48px'),
          '--dk-button-inline-padding': ref('space.sm'),
          '--dk-button-gap': ref('space.xs')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-button-block-size': literal('52px'),
          '--dk-button-inline-padding': ref('space.md'),
          '--dk-button-gap': ref('space.xs')
        }
      },
      {
        match: { axes: { content: 'icon-only' } },
        style: {
          '--dk-button-inline-padding': literal('0px'),
          '--dk-button-gap': literal('0px')
        }
      },
      {
        match: { axes: { variant: 'solid' } },
        style: {
          '--dk-button-bg': ref('primary'),
          '--dk-button-fg': ref('on-primary'),
          '--dk-button-border': ref('primary'),
          '--dk-button-shadow': ref('elevation.sm'),
          '--dk-button-focus-ring-color': ref('primary')
        }
      },
      {
        match: { axes: { variant: 'soft' } },
        style: {
          '--dk-button-bg': ref('color.primary-container'),
          '--dk-button-fg': ref('color.on-primary-container'),
          '--dk-button-border': ref('color.primary-container'),
          '--dk-button-focus-ring-color': ref('primary')
        }
      },
      {
        match: { axes: { variant: 'outline' } },
        style: {
          '--dk-button-bg': ref('surface'),
          '--dk-button-fg': ref('primary'),
          '--dk-button-border': ref('outline')
        }
      },
      {
        match: { axes: { variant: 'ghost' } },
        style: {
          '--dk-button-bg': ref('color.surface-bright'),
          '--dk-button-fg': ref('primary'),
          '--dk-button-border': literal('transparent')
        }
      },
      {
        match: { axes: { variant: 'link' } },
        style: {
          '--dk-button-bg': ref('color.surface-bright'),
          '--dk-button-fg': ref('primary'),
          '--dk-button-border': literal('transparent')
        }
      },
      {
        match: { axes: { variant: 'destructive' } },
        style: {
          '--dk-button-bg': ref('color.error'),
          '--dk-button-fg': ref('color.on-error'),
          '--dk-button-border': ref('color.error'),
          '--dk-button-shadow': ref('elevation.sm'),
          '--dk-button-focus-ring-color': ref('color.error')
        }
      },
      {
        match: { axes: { variant: 'solid' }, states: { hover: true, 'focus-visible': true } },
        style: {
          '--dk-button-shadow': ref('elevation.md')
        }
      },
      {
        match: { axes: { variant: 'soft' }, states: { hover: true } },
        style: {
          '--dk-button-shadow': ref('elevation.sm')
        }
      },
      {
        match: { axes: { variant: 'outline' }, states: { hover: true } },
        style: {
          '--dk-button-bg': ref('color.surface-bright')
        }
      },
      {
        match: { axes: { variant: 'ghost' }, states: { hover: true } },
        style: {
          '--dk-button-bg': ref('color.surface-dim')
        }
      },
      {
        match: { axes: { variant: 'link' }, states: { hover: true } },
        style: {
          '--dk-button-bg': ref('color.surface-dim')
        }
      },
      {
        match: { axes: { variant: 'destructive' }, states: { hover: true, 'focus-visible': true } },
        style: {
          '--dk-button-shadow': ref('elevation.md')
        }
      },
      {
        match: { states: { 'focus-visible': true } },
        style: {
          '--dk-button-shadow': ref('elevation.md')
        }
      },
      {
        match: { states: { pressed: true } },
        style: {
          '--dk-button-translate-y': literal('1px'),
          '--dk-button-shadow': literal('none')
        }
      },
      {
        match: { states: { disabled: true } },
        style: {
          '--dk-button-bg': ref('color.surface-dim'),
          '--dk-button-fg': ref('outline'),
          '--dk-button-border': ref('outline'),
          '--dk-button-shadow': literal('none'),
          '--dk-button-opacity': literal('0.72'),
          '--dk-button-cursor': literal('not-allowed')
        }
      },
      {
        match: { states: { loading: true } },
        style: {
          '--dk-button-opacity': literal('1'),
          '--dk-button-cursor': literal('progress')
        }
      }
    ],
    label: [
      {
        style: {
          '--dk-button-label-font-size': ref('type.sm'),
          '--dk-button-label-font-weight': literal('600'),
          '--dk-button-label-line-height': literal('1.1'),
          '--dk-button-label-decoration': literal('none'),
          '--dk-button-label-opacity': literal('1')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-button-label-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-button-label-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'md' } },
        style: {
          '--dk-button-label-font-size': ref('type.sm')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-button-label-font-size': ref('type.md')
        }
      },
      {
        match: { axes: { variant: 'link' }, states: { hover: true } },
        style: {
          '--dk-button-label-decoration': literal('underline')
        }
      },
      {
        match: { states: { loading: true } },
        style: {
          '--dk-button-label-opacity': literal('0.84')
        }
      }
    ],
    leading: [
      {
        style: {
          '--dk-button-icon-size': literal('18px')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-button-icon-size': literal('16px')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-button-icon-size': literal('20px')
        }
      }
    ],
    trailing: [
      {
        style: {
          '--dk-button-icon-size': literal('18px')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-button-icon-size': literal('16px')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-button-icon-size': literal('20px')
        }
      }
    ],
    icon: [
      {
        style: {
          '--dk-button-icon-size': literal('18px')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-button-icon-size': literal('16px')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-button-icon-size': literal('20px')
        }
      }
    ],
    spinner: [
      {
        style: {
          '--dk-button-spinner-size': literal('18px')
        }
      },
      {
        match: { axes: { size: 'xs' } },
        style: {
          '--dk-button-spinner-size': literal('16px')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-button-spinner-size': literal('20px')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'root',
        foreground: slotVar('root', '--dk-button-fg'),
        background: slotVar('root', '--dk-button-bg'),
        fontSize: slotVar('label', '--dk-button-label-font-size'),
        fontWeight: 600
      }
    ],
    target: [
      {
        target: 'root',
        minSize: literal('44px'),
        actualSize: slotVar('root', '--dk-button-block-size'),
        modality: 'touch'
      }
    ],
    layout: {
      target: 'root',
      widths: [180, 240, 320],
      heights: [44, 48, 52],
      noOverflow: true,
      inlinePadding: slotVar('root', '--dk-button-inline-padding'),
      gap: slotVar('root', '--dk-button-gap'),
      labelFontSize: slotVar('label', '--dk-button-label-font-size'),
      iconSize: slotVar('icon', '--dk-button-icon-size')
    }
  },
  proofCases: [
    { name: 'variants-md-label', axes: { size: 'md', content: 'label' }, sampleText: 'Continue' },
    { name: 'solid-sizes', axes: { variant: 'solid', content: 'label' }, sampleText: 'Continue' },
    { name: 'icon-md', axes: { variant: 'solid', size: 'md', content: 'icon-only' } },
    { name: 'icon-lg', axes: { variant: 'solid', size: 'lg', content: 'icon-only' } },
    {
      name: 'destructive-loading',
      axes: { variant: 'destructive', size: 'md', content: 'label' },
      states: ['loading'],
      sampleText: 'Delete'
    },
    {
      name: 'link-anchor',
      axes: { variant: 'link', size: 'md', content: 'label' },
      props: { as: 'a', href: '#' },
      sampleText: 'Open details'
    }
  ],
  a11y: {
    role: 'button',
    keyboardModel: 'activate',
    labelling: 'slot-label'
  }
});
