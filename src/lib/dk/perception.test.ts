import { describe, expect, it } from 'vitest';

import { analyzeDistinctness, deltaE00, deltaE00Lab, deltaEColorSpace, hexToLab, simulateCvd } from './perception';

describe('perception', () => {
  it('matches a published CIEDE2000 reference pair closely', () => {
    const delta = deltaE00Lab(
      { l: 50, a: 2.6772, b: -79.7751 },
      { l: 50, a: 0, b: -82.7485 }
    );

    expect(delta).toBeCloseTo(2.0425, 3);
  });

  it('computes color difference and simulates color-vision deficiency', () => {
    expect(deltaE00('#ff0000', '#00ff00')).toBeGreaterThan(50);
    expect(simulateCvd('#ff0000', 'deutan')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('reports collisions for low-distinctness palettes', () => {
    const report = analyzeDistinctness(['#3366ff', '#3a6cff', '#f59e0b'], 8);

    expect(report.collisions.length).toBe(1);
    expect(report.minDeltaE).toBeLessThan(8);
    expect(report.cvd.protan.minDeltaE).toBeGreaterThan(0);
  });

  it('converts hex colors into CIELAB coordinates', () => {
    const lab = hexToLab('#ffffff');

    expect(lab.l).toBeGreaterThan(99);
    expect(Math.abs(lab.a)).toBeLessThan(1);
  });
});

describe('CVD simulation regression', () => {
  // Reference values computed from the Machado et al. (2009) severity=1.0 matrices.
  // These matrices match Vienot et al. (1999) full dichromacy.

  describe('machado model at severity=1.0', () => {
    it('transforms pure red correctly for protanopia', () => {
      expect(simulateCvd('#ff0000', 'protan', 1, 'machado')).toBe('#271d00');
    });

    it('transforms pure red correctly for deuteranopia', () => {
      expect(simulateCvd('#ff0000', 'deutan', 1, 'machado')).toBe('#5e4700');
    });

    it('transforms pure red correctly for tritanopia', () => {
      expect(simulateCvd('#ff0000', 'tritan', 1, 'machado')).toBe('#ff0001');
    });

    it('transforms pure green correctly for protanopia', () => {
      expect(simulateCvd('#00ff00', 'protan', 1, 'machado')).toBe('#ffc900');
    });

    it('transforms pure green correctly for deuteranopia', () => {
      expect(simulateCvd('#00ff00', 'deutan', 1, 'machado')).toBe('#dbab0b');
    });

    it('transforms pure blue correctly for protanopia', () => {
      expect(simulateCvd('#0000ff', 'protan', 1, 'machado')).toBe('#0019ff');
    });
  });

  describe('neutral gray invariance', () => {
    it('leaves neutral gray unchanged under all CVD types (machado)', () => {
      expect(simulateCvd('#808080', 'protan', 1, 'machado')).toBe('#808080');
      expect(simulateCvd('#808080', 'deutan', 1, 'machado')).toBe('#808080');
      expect(simulateCvd('#808080', 'tritan', 1, 'machado')).toBe('#808080');
    });

    it('leaves neutral gray unchanged under all CVD types (simple)', () => {
      expect(simulateCvd('#808080', 'protan', 1, 'simple')).toBe('#808080');
      expect(simulateCvd('#808080', 'deutan', 1, 'simple')).toBe('#808080');
      expect(simulateCvd('#808080', 'tritan', 1, 'simple')).toBe('#808080');
    });
  });

  describe('severity=0 returns original color', () => {
    it('returns the input color at severity=0 (machado)', () => {
      // srgbToHex may return short hex form (#f00 vs #ff0000), so compare via regex
      expect(simulateCvd('#ff0000', 'protan', 0, 'machado')).toMatch(/^#f(f0000|00)$/);
      expect(simulateCvd('#00ff00', 'deutan', 0, 'machado')).toMatch(/^#0(0ff00|f0)$/);
      expect(simulateCvd('#0000ff', 'tritan', 0, 'machado')).toMatch(/^#0(000ff|0f)$/);
    });

    it('returns the input color at severity=0 (simple)', () => {
      expect(simulateCvd('#ff0000', 'protan', 0, 'simple')).toMatch(/^#f(f0000|00)$/);
      expect(simulateCvd('#00ff00', 'deutan', 0, 'simple')).toMatch(/^#0(0ff00|f0)$/);
      expect(simulateCvd('#0000ff', 'tritan', 0, 'simple')).toMatch(/^#0(000ff|0f)$/);
    });
  });

  describe('machado intermediate severity uses interpolated matrices', () => {
    it('produces different results for machado vs simple at severity=0.5', () => {
      // Machado interpolates between published nonlinear matrices.
      // Simple linearly blends identity with the s=1.0 matrix.
      // They should differ because the Machado curve is nonlinear.
      const machado = simulateCvd('#ff0000', 'protan', 0.5, 'machado');
      const simple = simulateCvd('#ff0000', 'protan', 0.5, 'simple');
      expect(machado).not.toBe(simple);
    });

    it('machado at severity=0.5 matches the published 0.5 matrix', () => {
      // Reference: Machado protan severity=0.5 matrix applied to pure red
      expect(simulateCvd('#ff0000', 'protan', 0.5, 'machado')).toBe('#751800');
    });
  });

  describe('simple model uses Machado severity=1.0 matrices (not ad-hoc)', () => {
    it('produces same result as machado model at severity=1.0', () => {
      // Both models should use the same Machado severity=1.0 matrix at full severity
      expect(simulateCvd('#ff0000', 'protan', 1, 'simple'))
        .toBe(simulateCvd('#ff0000', 'protan', 1, 'machado'));
      expect(simulateCvd('#ff0000', 'deutan', 1, 'simple'))
        .toBe(simulateCvd('#ff0000', 'deutan', 1, 'machado'));
      expect(simulateCvd('#ff0000', 'tritan', 1, 'simple'))
        .toBe(simulateCvd('#ff0000', 'tritan', 1, 'machado'));
    });
  });
});

describe('deltaE color space', () => {
  it('uses deltaEJz for jzazbz space (not deltaEITP)', () => {
    // deltaEJz operates in Jzazbz, deltaEITP operates in ICtCp.
    // They produce very different magnitudes for the same color pair.
    const jzResult = deltaEColorSpace('#ff0000', '#00ff00', 'jzazbz');
    // deltaEJz for red-green is ~0.23, deltaEITP would be ~256
    expect(jzResult).toBeLessThan(1);
    expect(jzResult).toBeGreaterThan(0.1);
  });

  it('uses deltaE2000 for oklch space', () => {
    const result = deltaEColorSpace('#ff0000', '#00ff00', 'oklch');
    expect(result).toBeGreaterThan(50);
  });

  it('uses Euclidean distance in CAM16-UCS', () => {
    const result = deltaEColorSpace('#ff0000', '#00ff00', 'cam16-ucs');
    expect(result).toBeGreaterThan(0);
  });
});
