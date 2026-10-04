import type { ThemeContract } from '@dkcli/core';

/** Serializes a DesignKit `ThemeContract` as JSON. */
export function emitThemeJson(contract: ThemeContract): string {
  return JSON.stringify(contract, null, 2);
}
