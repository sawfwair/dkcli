import type { ThemeContract } from '@dkcli/core';
import { assertThemeExportable } from './validate-export.ts';

/** Serializes a DesignKit `ThemeContract` as JSON. */
export function emitThemeJson(contract: ThemeContract): string {
  assertThemeExportable(contract);
  return JSON.stringify(contract, null, 2);
}
