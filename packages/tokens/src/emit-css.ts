import type { ThemeContract } from '@dkcli/core';

function emitFamily(prefix: string, family: Record<string, string | number>): string[] {
  return Object.entries(family).map(([name, value]) => `  --${prefix}-${name}: ${String(value)};`);
}

function resolveAlias(value: string): string {
  const refMatch = value.match(/^([a-z-]+)\.([a-z0-9-]+)$/i);
  if (!refMatch) {
    return value;
  }

  const [, prefix, token] = refMatch;
  return `var(--${prefix}-${token})`;
}

export function emitThemeCss(contract: ThemeContract): string {
  const lines = [
    `/* ${contract.name} */`,
    `/* optimized seed ${contract.meta.optimizedSeed} ratio ${contract.meta.ratioName} */`,
    ':root {',
    ...emitFamily('color', contract.families.color),
    ...emitFamily('space', contract.families.space),
    ...emitFamily('type', contract.families.type),
    ...emitFamily('radius', contract.families.radius),
    ...emitFamily('elevation', contract.families.elevation),
    ...emitFamily('motion', contract.families.motion),
    ...emitFamily('state', contract.families.state),
    ...Object.entries(contract.aliases).map(([name, value]) => `  --${name}: ${resolveAlias(value)};`),
    '}'
  ];

  return lines.join('\n');
}
