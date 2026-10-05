import { assertSafeCssValue, type ThemeContract } from '@dkcli/core';

/** Rejects token data that cannot produce the same resolvable CSS and JSON theme. */
export function assertThemeExportable(contract: ThemeContract): void {
  for (const [family, values] of Object.entries(contract.families)) {
    for (const [token, value] of Object.entries(values)) {
      if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'number' && !Number.isFinite(value))) {
        throw new Error(`Use a finite number or CSS string for ${family}.${token}.`);
      }
      assertSafeCssValue(value, `${family}.${token}`);
    }
  }
  for (const name of Object.keys(contract.aliases)) {
    let value = name;
    const seen = new Set<string>();
    while (Object.hasOwn(contract.aliases, value)) {
      if (seen.has(value)) throw new Error(`Circular theme alias detected for "${name}".`);
      seen.add(value);
      value = contract.aliases[value];
    }
    const reference = value.match(/^([a-z-]+)\.([a-z0-9_-]+)$/i);
    if (reference) {
      const family = contract.families[reference[1] as keyof ThemeContract['families']];
      if (!Object.hasOwn(contract.families, reference[1]) || !family || !Object.hasOwn(family, reference[2])) {
        throw new Error(`Unknown theme token "${value}" in alias "${name}".`);
      }
    } else assertSafeCssValue(value, `alias ${name}`);
  }
}
