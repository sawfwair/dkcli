import { describe, expect, it } from 'vitest';

import type { CompiledComponentCase } from '@dkcli/core';

import { serializeCompiledSlotStyles } from './recipe.ts';

function compiledCase(vars: Record<string, string>): CompiledComponentCase {
  return {
    axes: {},
    caseKey: '',
    slots: {
      root: {
        baseVars: vars,
        stateVars: {}
      }
    }
  };
}

describe('shared recipe style serialization', () => {
  it('serializes safe custom properties', () => {
    expect(serializeCompiledSlotStyles(compiledCase({ '--demo-color': 'red' })).root).toBe('--demo-color: red;');
  });

  it('rejects CSS declaration breakout values', () => {
    expect(() =>
      serializeCompiledSlotStyles(compiledCase({ '--demo-color': 'red; } body { outline: 1px solid red; }' }))
    ).toThrow(/Unsafe CSS value/);
  });

  it('rejects unsafe custom property names', () => {
    expect(() => serializeCompiledSlotStyles(compiledCase({ color: 'red' }))).toThrow(/Unsafe CSS custom property name/);
  });
});
