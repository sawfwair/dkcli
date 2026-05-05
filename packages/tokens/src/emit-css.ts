import {
  assertSafeCssCustomPropertyBody,
  assertSafeCssCustomPropertyName,
  assertSafeCssValue,
  escapeCssComment,
  type ThemeContract
} from '@dkcli/core';

function emitFamily(prefix: string, family: Record<string, string | number>): string[] {
  return Object.entries(family).map(([name, value]) => {
    const propertyName = assertSafeCssCustomPropertyName(`--${prefix}-${name}`, `${prefix}.${name}`);
    return `  ${propertyName}: ${assertSafeCssValue(value, propertyName)};`;
  });
}

function resolveAlias(value: string): string {
  const refMatch = value.match(/^([a-z-]+)\.([a-z0-9-]+)$/i);
  if (!refMatch) {
    return assertSafeCssValue(value, 'theme alias');
  }

  const [, prefix, token] = refMatch;
  assertSafeCssCustomPropertyBody(`${prefix}-${token}`, `alias ${value}`);
  return `var(--${prefix}-${token})`;
}

export function emitThemeCss(contract: ThemeContract): string {
  const lines = [
    `/* ${escapeCssComment(contract.name)} */`,
    `/* optimized seed ${escapeCssComment(contract.meta.optimizedSeed)} ratio ${escapeCssComment(contract.meta.ratioName)} */`,
    ':root {',
    ...emitFamily('color', contract.families.color),
    ...emitFamily('space', contract.families.space),
    ...emitFamily('type', contract.families.type),
    ...emitFamily('radius', contract.families.radius),
    ...emitFamily('elevation', contract.families.elevation),
    ...emitFamily('motion', contract.families.motion),
    ...emitFamily('state', contract.families.state),
    ...Object.entries(contract.aliases).map(([name, value]) => {
      const propertyName = assertSafeCssCustomPropertyName(`--${name}`, `alias ${name}`);
      return `  ${propertyName}: ${resolveAlias(value)};`;
    }),
    '}'
  ];

  return lines.join('\n');
}
