import { type ThemeContract, type ThemeSeed } from '@dkcli/core';
export type CreateThemeOptions = {
    name: string;
    seed: ThemeSeed;
};
export declare function createTheme({ name, seed }: CreateThemeOptions): ThemeContract;
