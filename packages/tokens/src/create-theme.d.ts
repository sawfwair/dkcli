import { type ThemeContract, type ThemeSeed } from '@dkcli/core';
/** Names a theme and supplies its color, scale, density, and motion inputs. */
export type CreateThemeOptions = {
    name: string;
    seed: ThemeSeed;
};
/** Compiles token families and semantic aliases from a theme seed. */
export declare function createTheme({ name, seed: inputSeed }: CreateThemeOptions): ThemeContract;
