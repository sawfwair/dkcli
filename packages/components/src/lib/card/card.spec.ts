import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type CardPadding = 'sm' | 'md' | 'lg';
export type CardSurface = 'default' | 'raised' | 'outlined';

export const cardSpec: ComponentSpec = createComponentSpec({
  id: 'card',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'media', kind: 'container' },
    { name: 'header', kind: 'container' },
    { name: 'body', kind: 'container' },
    { name: 'footer', kind: 'container' }
  ],
  axes: [
    { name: 'padding', values: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'surface', values: ['default', 'raised', 'outlined'], default: 'default' }
  ],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-card-bg': alias('display-card-bg'),
          '--dk-card-fg': alias('display-card-fg'),
          '--dk-card-border': alias('display-card-border'),
          '--dk-card-radius': ref('radius.lg'),
          '--dk-card-padding': ref('space.md'),
          '--dk-card-shadow': ref('elevation.sm')
        }
      },
      {
        match: { axes: { padding: 'sm' } },
        style: { '--dk-card-padding': ref('space.sm') }
      },
      {
        match: { axes: { padding: 'lg' } },
        style: { '--dk-card-padding': ref('space.lg') }
      },
      {
        match: { axes: { surface: 'raised' } },
        style: { '--dk-card-shadow': ref('elevation.lg') }
      },
      {
        match: { axes: { surface: 'outlined' } },
        style: {
          '--dk-card-shadow': literal('none'),
          '--dk-card-border': ref('color.outline')
        }
      }
    ],
    media: [
      {
        style: {
          '--dk-card-media-radius': ref('radius.md'),
          '--dk-card-media-min-height': literal('140px')
        }
      }
    ],
    header: [
      {
        style: {
          '--dk-card-header-gap': ref('space.2xs'),
          '--dk-card-header-title-size': ref('type.sm'),
          '--dk-card-header-title-weight': literal('650'),
          '--dk-card-header-meta-size': ref('type.xs')
        }
      }
    ],
    body: [
      {
        style: {
          '--dk-card-body-size': ref('type.xs'),
          '--dk-card-body-line-height': literal('1.6')
        }
      }
    ],
    footer: [
      {
        style: {
          '--dk-card-footer-gap': ref('space.xs')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'root',
        foreground: slotVar('root', '--dk-card-fg'),
        background: slotVar('root', '--dk-card-bg'),
        fontSize: slotVar('body', '--dk-card-body-size'),
        fontWeight: 500
      }
    ],
    layout: {
      target: 'root',
      widths: [280, 360],
      heights: [220, 320],
      noOverflow: true,
      blockSize: literal('220px')
    }
  },
  proofCases: [
    { name: 'default', axes: { padding: 'md', surface: 'default' } },
    { name: 'raised', axes: { padding: 'md', surface: 'raised' } },
    { name: 'outlined', axes: { padding: 'md', surface: 'outlined' } }
  ],
  a11y: {
    role: 'group',
    labelling: 'external-label'
  }
});
