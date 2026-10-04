import { type ThemeContract } from '@dkcli/core';
/** Serializes theme families and aliases as CSS custom properties in a `:root` rule. */
export declare function emitThemeCss(contract: ThemeContract): string;
