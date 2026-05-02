import type { ThemeContract } from '@dkcli/core';

export function emitThemeJson(contract: ThemeContract): string {
  return JSON.stringify(contract, null, 2);
}
