export type GlassParams = {
    blur?: number;
    opacity?: number;
    tint?: string;
    mode?: 'light' | 'dark';
    layers?: number;
    borderOpacity?: number;
    saturation?: number;
    noise?: number;
    selector?: string;
    radius?: number;
};
export declare function noiseDataUri(intensity: number): string;
export declare function hexToRgba(hex: string, alpha: number): string;
export declare function generateGlassCss(params?: GlassParams): string;
