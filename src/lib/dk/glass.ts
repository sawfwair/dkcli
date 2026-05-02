// Glass — Layered glass material CSS generation

import { hexToSrgb } from './color.ts';

export type GlassParams = {
  blur?: number;
  opacity?: number;
  tint?: string;
  mode?: 'light' | 'dark';
  layers?: number;
  borderOpacity?: number;
  saturation?: number;
  noise?: number;
  selector?: string;
  radius?: number;
};

export function noiseDataUri(intensity: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="${intensity}"/></svg>`;
  return `url("data:image/svg+xml;base64,${btoa(svg)}")`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToSrgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

export function generateGlassCss(params: GlassParams = {}): string {
  const blur = params.blur ?? 12;
  const opacity = params.opacity ?? 0.08;
  const mode = params.mode ?? 'light';
  const tint = params.tint ?? (mode === 'light' ? '#ffffff' : '#000000');
  const layers = Math.min(3, Math.max(1, params.layers ?? 1));
  const borderOpacity = params.borderOpacity ?? 0.15;
  const saturation = params.saturation ?? 120;
  const noise = params.noise ?? 0;
  const selector = params.selector ?? '.glass';
  const radius = params.radius ?? 16;

  const lines: string[] = [];
  const bg = hexToRgba(tint, opacity);
  const bdFilter = `blur(${blur}px) saturate(${saturation}%)`;
  const border = `1px solid rgba(255, 255, 255, ${borderOpacity})`;

  lines.push(`${selector} {`);
  lines.push(`  position: relative;`);
  if (layers > 1) lines.push(`  isolation: isolate;`);
  if (noise > 0) {
    lines.push(`  background-color: ${bg};`);
    lines.push(`  background-image: ${noiseDataUri(noise)};`);
    lines.push(`  background-size: 200px 200px;`);
  } else {
    lines.push(`  background: ${bg};`);
  }
  lines.push(`  backdrop-filter: ${bdFilter};`);
  lines.push(`  -webkit-backdrop-filter: ${bdFilter};`);
  lines.push(`  border: ${border};`);
  if (radius > 0) lines.push(`  border-radius: ${radius}px;`);
  lines.push('}');

  const pseudos = ['::before', '::after'];
  for (let i = 1; i < layers; i++) {
    const layerBlur = blur * (1 + i * 0.5);
    const layerOpacity = parseFloat((opacity * (1 - i * 0.3)).toFixed(3));
    lines.push('');
    lines.push(`${selector}${pseudos[i - 1]} {`);
    lines.push(`  content: '';`);
    lines.push(`  position: absolute;`);
    lines.push(`  inset: 0;`);
    lines.push(`  border-radius: inherit;`);
    lines.push(`  background: ${hexToRgba(tint, layerOpacity)};`);
    lines.push(`  backdrop-filter: blur(${layerBlur}px);`);
    lines.push(`  -webkit-backdrop-filter: blur(${layerBlur}px);`);
    lines.push(`  z-index: ${-i};`);
    lines.push('}');
  }

  return lines.join('\n');
}
