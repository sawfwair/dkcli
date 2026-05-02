import type { ThemeSeed } from './component-spec.ts';
export type ThemeTokenValue = number | string;
export type ThemeFamily = Record<string, ThemeTokenValue>;
export type ThemeContract = {
    name: string;
    seed: ThemeSeed;
    meta: {
        optimizedSeed: string;
        paletteScore: number;
        mode: ThemeSeed['mode'];
        density: ThemeSeed['density'];
        ratioName: string;
        ratioValue: number;
    };
    families: {
        color: ThemeFamily;
        space: ThemeFamily;
        type: ThemeFamily;
        radius: ThemeFamily;
        elevation: ThemeFamily;
        motion: ThemeFamily;
        state: ThemeFamily;
    };
    aliases: Record<string, string>;
};
