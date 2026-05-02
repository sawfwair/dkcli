import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export type SkeletonVariant = 'text' | 'block' | 'avatar';
export type SkeletonSize = 'sm' | 'md' | 'lg';

export const skeletonSpec: ComponentSpec = createComponentSpec({
  id: 'skeleton',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'line', kind: 'container' }
  ],
  axes: [
    { name: 'variant', values: ['text', 'block', 'avatar'], default: 'text' },
    { name: 'size', values: ['sm', 'md', 'lg'], default: 'md' }
  ],
  states: ['rest', 'loading'],
  recipe: {
    root: [
      {
        style: {
          '--dk-skeleton-bg': ref('color.surface-dim'),
          '--dk-skeleton-shimmer': ref('color.surface-bright'),
          '--dk-skeleton-radius': ref('radius.md'),
          '--dk-skeleton-gap': ref('space.2xs'),
          '--dk-skeleton-block-size': literal('0.875rem'),
          '--dk-skeleton-inline-size': literal('100%')
        }
      },
      {
        match: { axes: { size: 'sm' } },
        style: {
          '--dk-skeleton-block-size': literal('0.75rem')
        }
      },
      {
        match: { axes: { size: 'lg' } },
        style: {
          '--dk-skeleton-block-size': literal('1rem')
        }
      },
      {
        match: { axes: { variant: 'block', size: 'sm' } },
        style: {
          '--dk-skeleton-block-size': literal('96px'),
          '--dk-skeleton-radius': ref('radius.lg')
        }
      },
      {
        match: { axes: { variant: 'block', size: 'md' } },
        style: {
          '--dk-skeleton-block-size': literal('128px'),
          '--dk-skeleton-radius': ref('radius.lg')
        }
      },
      {
        match: { axes: { variant: 'block', size: 'lg' } },
        style: {
          '--dk-skeleton-block-size': literal('168px'),
          '--dk-skeleton-radius': ref('radius.lg')
        }
      },
      {
        match: { axes: { variant: 'avatar', size: 'sm' } },
        style: {
          '--dk-skeleton-block-size': literal('32px'),
          '--dk-skeleton-inline-size': literal('32px'),
          '--dk-skeleton-radius': ref('radius.pill')
        }
      },
      {
        match: { axes: { variant: 'avatar', size: 'md' } },
        style: {
          '--dk-skeleton-block-size': literal('44px'),
          '--dk-skeleton-inline-size': literal('44px'),
          '--dk-skeleton-radius': ref('radius.pill')
        }
      },
      {
        match: { axes: { variant: 'avatar', size: 'lg' } },
        style: {
          '--dk-skeleton-block-size': literal('56px'),
          '--dk-skeleton-inline-size': literal('56px'),
          '--dk-skeleton-radius': ref('radius.pill')
        }
      }
    ],
    line: [
      {
        style: {
          '--dk-skeleton-line-radius': ref('radius.md')
        }
      }
    ]
  },
  proofs: {
    layout: {
      target: 'root',
      widths: [120, 240, 360],
      heights: [16, 128, 56],
      noOverflow: true,
      blockSize: slotVar('root', '--dk-skeleton-block-size')
    }
  },
  proofCases: [
    { name: 'text-md', axes: { variant: 'text', size: 'md' } },
    { name: 'block-md', axes: { variant: 'block', size: 'md' } },
    { name: 'avatar-lg', axes: { variant: 'avatar', size: 'lg' } }
  ],
  a11y: {
    role: 'presentation',
    labelling: 'external-label'
  }
});
