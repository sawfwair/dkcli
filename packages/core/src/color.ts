import Color from 'colorjs.io';

import type { ColorSpace, Gamut } from './types.ts';

export type ColorResult = {
  oklch: string;
  hex: string;
  css: string;
  l: number;
  c: number;
  h: number;
  gamut: Gamut;
};

export type ParsedColor = {
  hex: string;
  css: string;
  oklch: [number, number, number];
  cam16Ucs: [number, number, number];
  jzazbz: [number, number, number];
  gamut: Gamut;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits: number = 4): number {
  return parseFloat(value.toFixed(digits));
}

function asColor(input: string): Color {
  return new Color(input);
}

function gamutSpace(gamut: Gamut): 'srgb' | 'p3' | 'rec2100pq' {
  if (gamut === 'p3') {
    return 'p3';
  }
  if (gamut === 'hdr') {
    return 'rec2100pq';
  }
  return 'srgb';
}

export function hexToSrgb(hex: string): [number, number, number] {
  const color = asColor(hex).to('srgb');
  return color.coords.map((value) => clamp(value ?? 0, 0, 1)) as [number, number, number];
}

export function srgbToHex(r: number, g: number, b: number): string {
  return new Color('srgb', [clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1)]).to('srgb').toString({
    format: 'hex'
  });
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

export function hexToOklch(input: string): [number, number, number] {
  const color = asColor(input).to('oklch');
  return color.coords as [number, number, number];
}

export function oklchToSrgb(L: number, C: number, H: number): [number, number, number] {
  const color = new Color('oklch', [L, C, H]).to('srgb');
  return color.coords.map((value) => clamp(value ?? 0, 0, 1)) as [number, number, number];
}

export function oklchToHex(L: number, C: number, H: number): string {
  return new Color('oklch', [L, C, H]).to('srgb').toString({ format: 'hex' });
}

export function oklchInGamut(L: number, C: number, H: number, gamut: Gamut = 'srgb'): boolean {
  return new Color('oklch', [L, C, H]).inGamut(gamutSpace(gamut));
}

export function gamutClip(L: number, C: number, H: number, gamut: Gamut = 'srgb'): [number, number, number] {
  const target = new Color('oklch', [L, C, H]).toGamut({ space: gamutSpace(gamut), method: 'css' }).to('oklch');
  return target.coords as [number, number, number];
}

export function hexToCam16Ucs(input: string): [number, number, number] {
  const [J, M, h] = asColor(input).to('cam16-jmh').coords as [number, number, number];
  const hue = (h * Math.PI) / 180;
  const jPrime = (1.7 * J) / (1 + 0.007 * J);
  const mPrime = Math.log(1 + 0.0228 * M) / 0.0228;
  return [round(jPrime), round(mPrime * Math.cos(hue)), round(mPrime * Math.sin(hue))];
}

export function hexToJzazbz(input: string): [number, number, number] {
  return asColor(input)
    .to('jzazbz')
    .coords.map((value) => round(value ?? 0, 6)) as [number, number, number];
}

export function parseCssColor(input: string, gamut: Gamut = 'srgb'): ParsedColor {
  const color = asColor(input).toGamut({ space: gamutSpace(gamut), method: 'css' });
  const hex = color.to('srgb').toString({ format: 'hex' });
  const oklch = color.to('oklch').coords as [number, number, number];
  const css =
    gamut === 'srgb'
      ? hex
      : color.to(gamutSpace(gamut)).toString({
          format: 'color'
        });

  return {
    hex,
    css,
    oklch,
    cam16Ucs: hexToCam16Ucs(hex),
    jzazbz: hexToJzazbz(hex),
    gamut
  };
}

export function toColorSpace(input: string, space: ColorSpace): [number, number, number] {
  if (space === 'cam16-ucs') {
    return hexToCam16Ucs(parseCssColor(input).hex);
  }
  if (space === 'jzazbz') {
    return hexToJzazbz(parseCssColor(input).hex);
  }
  return hexToOklch(parseCssColor(input).hex);
}

export function serializeColorSpace(
  coords: [number, number, number],
  space: ColorSpace = 'oklch',
  gamut: Gamut = 'srgb'
): string {
  if (space === 'jzazbz') {
    return `jzazbz(${round(coords[0], 6)} ${round(coords[1], 6)} ${round(coords[2], 6)})`;
  }
  if (space === 'cam16-ucs') {
    return `cam16-ucs(${round(coords[0], 3)} ${round(coords[1], 3)} ${round(coords[2], 3)})`;
  }
  const color = new Color('oklch', coords).toGamut({ space: gamutSpace(gamut), method: 'css' });
  return color.toString({ format: gamut === 'srgb' ? 'hex' : 'color' });
}

export function luminance(hex: string): number {
  const [sr, sg, sb] = hexToSrgb(hex);
  return 0.2126 * srgbToLinear(sr) + 0.7152 * srgbToLinear(sg) + 0.0722 * srgbToLinear(sb);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const y1 = luminance(hex1);
  const y2 = luminance(hex2);
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
}

export function autoContrast(bgHex: string): string {
  return contrastRatio(bgHex, '#ffffff') >= contrastRatio(bgHex, '#0a0a0a')
    ? '#ffffff'
    : '#0a0a0a';
}

export type APCAResult = { Lc: number; polarity: 'light-bg' | 'dark-bg'; abs: number };
export type SizeWeightCheck = { pass: boolean; minLc: number; recommendation: string };

export function hexToY(hex: string): number {
  const [sr, sg, sb] = hexToSrgb(hex);
  const Y =
    0.2126729 * Math.pow(sr, 2.4) + 0.7151522 * Math.pow(sg, 2.4) + 0.0721750 * Math.pow(sb, 2.4);
  return Y > 0.022 ? Y : Y + Math.pow(0.022 - Y, 1.414);
}

export function apcaContrast(fgHex: string, bgHex: string): APCAResult {
  const txtY = hexToY(fgHex);
  const bgY = hexToY(bgHex);

  if (Math.abs(bgY - txtY) < 0.0005) {
    return { Lc: 0, polarity: 'light-bg', abs: 0 };
  }

  let SAPC = 0.0;
  let outputContrast = 0.0;

  if (bgY > txtY) {
    SAPC = (Math.pow(bgY, 0.56) - Math.pow(txtY, 0.57)) * 1.14;
    outputContrast = SAPC < 0.1 ? 0.0 : SAPC - 0.027;
  } else {
    SAPC = (Math.pow(bgY, 0.65) - Math.pow(txtY, 0.62)) * 1.14;
    outputContrast = SAPC > -0.1 ? 0.0 : SAPC + 0.027;
  }

  const Lc = outputContrast * 100;
  return {
    Lc: round(Lc, 1),
    polarity: bgY > txtY ? 'light-bg' : 'dark-bg',
    abs: round(Math.abs(Lc), 1)
  };
}

export function apcaCheck(Lc: number, size: number, weight: number): SizeWeightCheck {
  const absLc = Math.abs(Lc);
  let minLc: number;
  if (size <= 14 && weight <= 400) minLc = 90;
  else if (size <= 16 && weight <= 400) minLc = 75;
  else if (size <= 18 && weight <= 400) minLc = 60;
  else if (size <= 24 && weight <= 400) minLc = 45;
  else if (size <= 14 && weight <= 700) minLc = 75;
  else if (size <= 16 && weight <= 700) minLc = 60;
  else if (size <= 18 && weight <= 700) minLc = 45;
  else if (size <= 24 && weight <= 700) minLc = 30;
  else minLc = 30;
  return {
    pass: absLc >= minLc,
    minLc,
    recommendation: absLc >= minLc ? `PASS (Lc ${absLc} >= ${minLc})` : `FAIL (Lc ${absLc} < ${minLc})`
  };
}

export function autoContrastAPCA(bgHex: string): string {
  const whiteResult = apcaContrast('#ffffff', bgHex);
  const blackResult = apcaContrast('#0a0a0a', bgHex);
  return Math.abs(whiteResult.Lc) >= Math.abs(blackResult.Lc) ? '#ffffff' : '#0a0a0a';
}

export function fmtOklch(L: number, C: number, H: number): string {
  return `oklch(${round(L, 3)} ${round(C, 4)} ${Math.round(H)})`;
}

export function makeColor(L: number, C: number, H: number, gamut: Gamut = 'srgb'): ColorResult {
  const [cl, cc, ch] = gamutClip(L, C, H, gamut);
  const css =
    gamut === 'srgb'
      ? oklchToHex(cl, cc, ch)
      : new Color('oklch', [cl, cc, ch]).toGamut({ space: gamutSpace(gamut), method: 'css' }).toString({
          format: 'color'
        });
  return {
    oklch: fmtOklch(cl, cc, ch),
    hex: oklchToHex(cl, cc, ch),
    css,
    l: cl,
    c: cc,
    h: ch,
    gamut
  };
}
