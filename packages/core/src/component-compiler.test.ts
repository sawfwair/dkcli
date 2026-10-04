import { describe, expect, it } from 'vitest';

import { compileComponentRecipe, compileProjectComponentFixtures } from './component-compiler.ts';
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

describe('component proof coverage', () => {
  it('evaluates declared distinctness and fails identical resolved colors', () => {
    const theme = makeTheme();
    theme.families.color = { action: '#ff0000', warning: '#ff0000' };
    const spec = makeSpec({
      proofs: { distinctness: [{ tokens: ['color.action', 'color.warning'], minDeltaE: 20, cvd: true }] }
    });

    const [fixture] = compileComponentRecipe(spec, theme).proofFixtures;

    expect(fixture).toMatchObject({
      evidence: 'mathematical',
      distinctness: [{
        tokens: ['color.action', 'color.warning'],
        colors: ['#ff0000', '#ff0000'],
        requiredMinDeltaE: 20,
        cvd: true,
        report: { minDeltaE: 0 },
        pass: false
      }],
      coverage: { declared: ['distinctness'], evaluated: ['distinctness'], unsupported: [], complete: true },
      pass: false
    });
  });

  it('reports every requested layout width and fails if a narrow width does not fit', () => {
    const spec = makeSpec({
      proofs: {
        layout: { target: 'root', widths: [80, 320], noOverflow: true, blockSize: 40, labelFontSize: 16 }
      },
      proofCases: [{ name: 'responsive-label', sampleText: 'A longish label right here' }]
    });

    const [fixture] = compileComponentRecipe(spec, makeTheme()).proofFixtures;

    expect(fixture).toMatchObject({
      layout: [{
        estimatedInlinePx: 232.96,
        widthChecks: [{ width: 80, pass: false }, { width: 320, pass: true }],
        pass: false
      }],
      pass: false
    });
  });

  it('makes unsupported runtime proof kinds explicit instead of silently passing', () => {
    const runtimeProofs = { motion: [], screenshot: [{ target: 'root' }] };
    const [fixture] = compileComponentRecipe(makeSpec({ proofs: runtimeProofs }), makeTheme()).proofFixtures;

    expect(fixture).toMatchObject({
      coverage: { declared: ['screenshot'], evaluated: [], unsupported: ['screenshot'], complete: false },
      resolved: false,
      pass: false
    });
  });

  it('resolves aliases and requires the authored CVD threshold only when requested', () => {
    const theme = makeTheme();
    theme.families.color = { action: '#ff0000', warning: '#008000' };
    theme.aliases = { action: 'color.action', warning: 'color.warning' };
    const proof = { tokens: ['action', 'warning'], minDeltaE: 40, cvd: false };
    const [normalFixture] = compileComponentRecipe(makeSpec({ proofs: { distinctness: [proof] } }), theme).proofFixtures;
    const [cvdFixture] = compileComponentRecipe(makeSpec({ proofs: { distinctness: [{ ...proof, cvd: true }] } }), theme).proofFixtures;

    expect(normalFixture.distinctness[0].report.minDeltaE).toBeGreaterThan(40);
    expect(normalFixture.pass).toBe(true);
    expect(cvdFixture.distinctness[0].report.cvd.deutan.minDeltaE).toBeLessThan(40);
    expect(cvdFixture.pass).toBe(false);
    expect(cvdFixture.coverage.complete).toBe(true);
  });

  it('keeps layout overflow permitted when the author explicitly allows it', () => {
    const [fixture] = compileComponentRecipe(makeSpec({
      proofs: { layout: { target: 'root', widths: [20, 320], noOverflow: false, blockSize: 40, labelFontSize: 16 } },
      proofCases: [{ name: 'allowed-overflow', sampleText: 'A longish label right here' }]
    }), makeTheme()).proofFixtures;

    expect(fixture.layout[0].widthChecks).toEqual([
      { width: 20, fitsWidth: true, fitsHeight: true, pass: true },
      { width: 320, fitsWidth: true, fitsHeight: true, pass: true }
    ]);
    expect(fixture.pass).toBe(true);
  });

  it.each([[], [0], [-1], [Number.NaN], [Number.POSITIVE_INFINITY]].map((widths) => ({ widths })))('rejects invalid layout widths $widths', ({ widths }) => {
    const spec = makeSpec({ proofs: { layout: { target: 'root', widths, noOverflow: true, blockSize: 40 } } });
    expect(() => compileComponentRecipe(spec, makeTheme())).toThrow(/finite positive width/);
  });

  it.each([
    { tokens: ['color.action'], minDeltaE: 20, cvd: false },
    { tokens: ['color.action', 'color.warning'], minDeltaE: -1, cvd: false },
    { tokens: ['color.action', 'color.warning'], minDeltaE: Number.NaN, cvd: false }
  ])('rejects distinctness declarations that cannot produce a finite pairwise verdict', (proof) => {
    expect(() => compileComponentRecipe(makeSpec({ proofs: { distinctness: [proof] } }), makeTheme())).toThrow(/Distinctness proofs require/);
  });
});


describe('recorded project viewport proofs', () => {
  it('applies an explicitly authored viewport cap while preserving the preferred surface width', () => {
    const anchored = { target: 'root', viewportWidth: 1280, viewportHeight: 720, surfaceWidth: 320, surfaceHeight: 80, offset: 8, viewportPadding: 16, viewportConstrained: true };
    const theme = makeTheme();
    const spec = makeSpec({ proofs: { anchoredSurface: [anchored] } });
    const recipe = compileComponentRecipe(spec, theme);
    const [fixture] = compileProjectComponentFixtures(spec, recipe, theme, [320, 1280]);
    expect(fixture.anchoredSurface).toMatchObject([
      { viewportWidth: 1280, surfaceWidthPx: 320, preferredSurfaceWidthPx: 320, effectiveSurfaceWidthPx: 320, pass: true },
      { viewportWidth: 320, surfaceWidthPx: 320, preferredSurfaceWidthPx: 320, effectiveSurfaceWidthPx: 288, pass: true }
    ]);
    expect(fixture.pass).toBe(true);
  });

  it('does not infer a viewport cap or let an authored width cap hide vertical overflow', () => {
    const theme = makeTheme();
    const nominal = { target: 'root', viewportWidth: 320, viewportHeight: 720, surfaceWidth: 320, surfaceHeight: 80, offset: 8, viewportPadding: 16 };
    const tall = { ...nominal, surfaceHeight: 720, viewportConstrained: true };
    const [fixture] = compileComponentRecipe(makeSpec({ proofs: { anchoredSurface: [nominal, tall] } }), theme).proofFixtures;
    expect(fixture.anchoredSurface).toMatchObject([
      { preferredSurfaceWidthPx: 320, effectiveSurfaceWidthPx: 320, pass: false },
      { preferredSurfaceWidthPx: 320, effectiveSurfaceWidthPx: 288, pass: false }
    ]);
    expect(fixture.pass).toBe(false);
  });

  it('retains failing declared widths and adds recorded widths without mutating recipes', () => {
    const theme = makeTheme();
    const spec = makeSpec({
      proofs: {
        layout: { target: 'root', widths: [120, 320], noOverflow: true, labelFontSize: 16, blockSize: 40, inlinePadding: 0, gap: 0, iconSize: 0 },
        helperText: [{ target: 'root', widths: [120], fontSize: 16, maxLines: 2 }],
        anchoredSurface: [{ target: 'root', viewportWidth: 320, viewportHeight: 720, surfaceWidth: 200, surfaceHeight: 80, offset: 8, viewportPadding: 16 }]
      },
      proofCases: [{ name: 'Long label', sampleText: 'A deliberately long label that cannot fit in a narrow container' }]
    });
    const recipe = compileComponentRecipe(spec, theme);
    const before = JSON.stringify({ spec, recipe });
    const fixtures = compileProjectComponentFixtures(spec, recipe, theme, [320, 768, 1280]);
    expect(fixtures).toHaveLength(recipe.proofFixtures.length);
    expect(fixtures[0].layout[0].widths).toEqual([120, 320, 768, 1280]);
    expect(fixtures[0].layout[0].widthChecks[0]).toMatchObject({ width: 120, pass: false });
    expect(fixtures[0].layout[0].pass).toBe(false);
    expect(fixtures[0].helperText[0].widths).toEqual([120, 320, 768, 1280]);
    expect(fixtures[0].anchoredSurface.map((check) => check.viewportWidth)).toEqual([320, 768, 1280]);
    expect(JSON.stringify({ spec, recipe })).toBe(before);
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid recorded proof width %s', (width) => {
    const theme = makeTheme();
    const spec = makeSpec();
    const recipe = compileComponentRecipe(spec, theme);
    expect(() => compileProjectComponentFixtures(spec, recipe, theme, [width])).toThrow('positive finite widths');
  });
});


describe('motion proof duration units', () => {
  it('converts seconds to milliseconds before applying the declared threshold', () => {
    const theme = makeTheme();
    const spec = makeSpec({
      recipe: { root: [{ style: { '--dk-motion-duration': literal('0.5s') } }] },
      proofs: { motion: [{ target: 'root', durationMaxMs: 300 }] }
    });
    const recipe = compileComponentRecipe(spec, theme);
    expect(recipe.proofFixtures[0].motion).toEqual([{ target: 'root', durationMs: 500, durationMaxMs: 300, pass: false }]);
    expect(recipe.proofFixtures[0].pass).toBe(false);
  });

  it('rejects a length used as a duration', () => {
    const theme = makeTheme();
    const spec = makeSpec({
      recipe: { root: [{ style: { '--dk-motion-duration': literal('16px') } }] },
      proofs: { motion: [{ target: 'root', durationMaxMs: 300 }] }
    });
    expect(() => compileComponentRecipe(spec, theme)).toThrow('numeric duration');
  });
});


it('normalizes uppercase clamp units before estimating their conservative bound', () => {
  const theme = makeTheme();
  const spec = makeSpec({ proofs: { target: [{ target: 'root', modality: 'touch', minSize: 44, actualSize: literal('clamp(8PX, 2vw, 1REM)') }] } });
  expect(compileComponentRecipe(spec, theme).proofFixtures[0].target[0].actualSizePx).toBe(16);
});
