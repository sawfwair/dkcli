import { createComponentSpec, type ComponentSpec, type TokenExpr } from '@dkcli/core';

const literal = (value: number | string): TokenExpr => ({ literal: value });
const ref = (value: string): TokenExpr => ({ ref: value });
const alias = (value: string): TokenExpr => ({ alias: value });
const slotVar = (slot: string, name: string): TokenExpr => ({ slotVar: { slot, name } });

export const tooltipSpec: ComponentSpec = createComponentSpec({
  id: 'tooltip',
  slots: [
    { name: 'root', kind: 'container', required: true },
    { name: 'surface', kind: 'container', required: true },
    { name: 'content', kind: 'text', role: 'body' }
  ],
  axes: [],
  states: ['rest', 'open'],
  recipe: {
    root: [
      {
        style: {
          '--dk-motion-duration': ref('motion.fast')
        }
      }
    ],
    surface: [
      {
        style: {
          '--dk-tooltip-surface-bg': alias('floating-bg'),
          '--dk-tooltip-surface-fg': alias('floating-fg'),
          '--dk-tooltip-surface-border': alias('floating-border'),
          '--dk-tooltip-surface-shadow': alias('floating-shadow'),
          '--dk-tooltip-surface-radius': alias('overlay-radius'),
          '--dk-tooltip-surface-padding': literal('0.75rem'),
          '--dk-tooltip-surface-max-width': literal('240px'),
          '--dk-tooltip-offset': literal('8px')
        }
      }
    ],
    content: [
      {
        style: {
          '--dk-tooltip-content-size': literal('0.8125rem')
        }
      }
    ]
  },
  proofs: {
    contrast: [
      {
        target: 'surface',
        foreground: slotVar('surface', '--dk-tooltip-surface-fg'),
        background: slotVar('surface', '--dk-tooltip-surface-bg'),
        fontSize: slotVar('content', '--dk-tooltip-content-size'),
        fontWeight: 500
      }
    ],
    anchoredSurface: [
      {
        target: 'surface',
        viewportWidth: 1280,
        viewportHeight: 720,
        surfaceWidth: slotVar('surface', '--dk-tooltip-surface-max-width'),
        surfaceHeight: literal('72px'),
        offset: slotVar('surface', '--dk-tooltip-offset'),
        viewportPadding: 16
      }
    ],
    motion: [
      {
        target: 'root',
        durationMaxMs: 240
      }
    ]
  },
  proofCases: [
    {
      name: 'tooltip-default',
      states: ['open'],
      sampleText: 'Tooltip copy'
    }
  ],
  a11y: {
    role: 'tooltip',
    labelling: 'external-label'
  }
});
