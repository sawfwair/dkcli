import { describe, expect, it } from 'vitest';

import { generateGlassCss, hexToRgba, noiseDataUri } from './glass';

describe('glass', () => {
  it('builds SVG noise data URIs', () => {
    expect(noiseDataUri(0.05)).toContain('data:image/svg+xml;base64');
  });

  it('converts hex colors to rgba strings', () => {
    expect(hexToRgba('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('generates layered glass css with optional noise', () => {
    const css = generateGlassCss({
      selector: '.glass-card',
      blur: 10,
      opacity: 0.12,
      layers: 2,
      noise: 0.03,
      tint: '#ffffff'
    });

    expect(css).toContain('.glass-card {');
    expect(css).toContain('background-image:');
    expect(css).toContain('.glass-card::before');
    expect(css).toContain('backdrop-filter');
  });
});
