import { cssColorAlpha, parseCssColor, validateProjectTheme, type ProjectTheme, type ThemeContract, type ProjectTokenFamily } from '@dkcli/core';
import { createTheme } from './create-theme.ts';

const LENGTH = /^(?:0|(?:\d*\.?\d+)(?:px|rem|em))$/i;
function supportedLength(text: string): boolean {
  if (LENGTH.test(text)) return Number.isFinite(Number.parseFloat(text));
  const clamp = text.match(/^clamp\(\s*(\d*\.?\d+)(px|rem|em)\s*,\s*(.+)\s*,\s*(\d*\.?\d+)(px|rem|em)\s*\)$/i);
  if (!clamp) return false;
  const center = clamp[3].trim().replace(/^calc\((.*)\)$/i, '$1');
  if (!/^(?:0|-?\d*\.?\d+(?:px|rem|em|vw|vh|%)(?:\s+[+-]\s+\d*\.?\d+(?:px|rem|em|vw|vh|%))*)$/i.test(center)) return false;
  if (![...center.matchAll(/-?\d*\.?\d+/g)].every((coefficient) => Number.isFinite(Number(coefficient[0])))) return false;
  const min = Number(clamp[1]) * (clamp[2].toLowerCase() === 'px' ? 1 : 16);
  const max = Number(clamp[4]) * (clamp[5].toLowerCase() === 'px' ? 1 : 16);
  return Number.isFinite(min) && Number.isFinite(max) && min <= max;
}

const DURATION = /^(?:\d+(?:\.\d+)?)(?:ms|s)$/;

function validateToken(family: ProjectTokenFamily, token: string, value: string | number, theme: ThemeContract): void {
  if (!Object.hasOwn(theme.families[family], token)) throw new Error(`Unknown theme token: ${family}.${token}.`);
  const text = String(value);
  if (family === 'color') {
    try { parseCssColor(text); }
    catch { throw new Error(`Use a resolvable CSS color for ${family}.${token}.`); }
    if (cssColorAlpha(text) !== 1) throw new Error(`Use an opaque color for ${family}.${token}; project contrast checks do not resolve alpha compositing.`);
  }
  if (['space', 'radius'].includes(family) && !supportedLength(text)) throw new Error(`Use a nonnegative px, rem, em, or supported clamp length for ${family}.${token}.`);
  if (family === 'type' && !token.startsWith('font-') && !supportedLength(text)) throw new Error(`Use a nonnegative px, rem, em, or supported clamp length for ${family}.${token}.`);
  if (family === 'type' && token.startsWith('font-')) throw new Error('Edit font stacks through the fonts configuration.');
  if (family === 'motion') {
    if (token === 'preset') throw new Error('Edit the motion preset through the theme seed.');
    const milliseconds = Number.parseFloat(text) * (text.endsWith('ms') ? 1 : 1000);
    if (!DURATION.test(text) || !Number.isFinite(milliseconds)) throw new Error(`Use a finite nonnegative CSS duration for ${family}.${token}.`);
  }
  if (family === 'state') throw new Error('Edit state tokens through the theme seed.');
}

/** Compiles the portable theme configuration used by the CLI and workbench. */
export function createProjectTheme(input: ProjectTheme): ThemeContract {
  const checked = validateProjectTheme(input);
  if (!checked.valid) throw new Error(Object.values(checked.errors).join(' '));
  const config = checked.theme;
  const theme = createTheme({ name: config.name, seed: config.seed });
  theme.families.type['font-body'] = config.fonts.body;
  theme.families.type['font-display'] = config.fonts.display;
  theme.families.type['font-mono'] = config.fonts.mono;
  for (const [family, values] of Object.entries(config.overrides ?? {})) {
    const key = family as ProjectTokenFamily;
    for (const [token, value] of Object.entries(values)) {
      validateToken(key, token, value, theme);
      theme.families[key][token] = value;
    }
  }
  return theme;
}
