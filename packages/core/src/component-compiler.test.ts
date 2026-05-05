import { describe, expect, it } from 'vitest';

import { compileComponentRecipe } from './component-compiler.ts';
import type { ComponentSpec, ComponentStateName, ThemeContract, TokenExpr } from './index.ts';

function literal(value: string | number): TokenExpr {
  return { literal: value };
}

function makeTheme(): ThemeContract {
  return {
    name: 'test-theme',
    seed: {
      color: '#295dff',
      contrastProfile: 'default',
      density: 'comfortable',
      mode: 'light',
      motion: 'snappy',
      ratio: 'perfect-fourth'
    },
    meta: {
      density: 'comfortable',
      mode: 'light',
      optimizedSeed: '#295dff',
      paletteScore: 1,
      ratioName: 'perfect fourth',
      ratioValue: 1.333
    },
    families: {
      color: {},
      elevation: {},
      motion: {},
      radius: {},
      space: {},
      state: {},
      type: {}
    },
    aliases: {}
  };
}

function makeSpec(overrides: Partial<ComponentSpec> = {}): ComponentSpec {
  return {
    id: 'demo',
    slots: [{ name: 'root', kind: 'container', required: true }],
    axes: [],
    states: ['rest'],
    recipe: {
      root: [
        {
          style: {
            '--demo-color': literal('red')
          }
        }
      ]
    },
    proofs: {},
    a11y: { role: 'group' },
    ...overrides
  };
}

describe('component recipe compiler safety', () => {
  it('rejects runtime-only prototype state names before they can pollute globals', () => {
    delete (Object.prototype as Record<string, unknown>)['--polluted'];
    const states = ['__proto__' as ComponentStateName];
    const matchStates = JSON.parse('{"__proto__":true}') as Partial<Record<ComponentStateName, boolean>>;
    const spec = makeSpec({
      states,
      recipe: {
        root: [
          {
            match: { states: matchStates },
            style: { '--polluted': literal('yes') }
          }
        ]
      }
    });

    expect(() => compileComponentRecipe(spec, makeTheme())).toThrow(/Unsupported component state/);
    expect((Object.prototype as Record<string, unknown>)['--polluted']).toBeUndefined();
  });

  it('rejects component recipe CSS declaration breakout values', () => {
    const spec = makeSpec({
      recipe: {
        root: [
          {
            style: {
              '--demo-color': literal('red; } body { outline: 1px solid red; }')
            }
          }
        ]
      }
    });

    expect(() => compileComponentRecipe(spec, makeTheme())).toThrow(/Unsafe CSS value/);
  });
});
