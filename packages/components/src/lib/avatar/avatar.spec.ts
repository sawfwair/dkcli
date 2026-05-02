import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'rounded';

export const avatarSpec: ComponentSpec = createComponentSpec({
  id: 'avatar',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'image', kind: 'container' },
    { name: 'fallback', kind: 'text', role: 'meta' }
  ],
  axes: [
    { name: 'size', values: ['sm', 'md', 'lg'], default: 'md' },
    { name: 'shape', values: ['circle', 'rounded'], default: 'circle' }
  ],
  states: ['rest'],
  recipe: {
    root: [
      {
        style: {
          '--dk-avatar-bg': alias('display-avatar-bg'),
          '--dk-avatar-fg': alias('display-avatar-fg'),
          '--dk-avatar-ring': alias('display-avatar-ring'),
          '--dk-avatar-size': literal('44px'),
          '--dk-avatar-radius': ref('radius.pill'),
          '--dk-avatar-ring-width': literal('1px')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-avatar-size': literal('32px') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-avatar-size': literal('56px') }
      },
      {
        match: { axes: { shape: 'rounded' } },
        style: { '--dk-avatar-radius': ref('radius.md') }
      }
    ],
    image: [
      {
        style: {
          '--dk-avatar-image-radius': literal('inherit')
        }
      }
    ],
    fallback: [
      {
        style: {
          '--dk-avatar-fallback-color': literal('inherit'),
          '--dk-avatar-fallback-size': ref('type.xs'),
          '--dk-avatar-fallback-weight': literal('700')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: { '--dk-avatar-fallback-size': literal('0.75rem') }
      },
      {
        match: { axes: { size: 'lg' } },
        style: { '--dk-avatar-fallback-size': ref('type.sm') }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'root',
        foreground: slotVar('root', '--dk-avatar-fg'),
        background: slotVar('root', '--dk-avatar-bg'),
        fontSize: slotVar('fallback', '--dk-avatar-fallback-size'),
        fontWeight: 700
      }
    ],
    target: [
      {
        target: 'root',
        minSize: literal('32px'),
        actualSize: slotVar('root', '--dk-avatar-size'),
        modality: 'mouse'
      }
    ]
  },
  proofCases: [
    { name: 'small-circle', axes: { size: 'sm', shape: 'circle' } },
    { name: 'medium-circle', axes: { size: 'md', shape: 'circle' } },
    { name: 'large-rounded', axes: { size: 'lg', shape: 'rounded' } }
  ],
  a11y: {
    role: 'img',
    labelling: 'aria-label'
  }
});
