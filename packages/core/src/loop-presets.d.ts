import type { FutureTopologyItem } from './future.ts';
export type LoopPreset = {
    id: string;
    label: string;
    query: string;
    items: FutureTopologyItem[];
};
export declare const LOOP_PRESET_IMAGES: Partial<Record<string, Partial<Record<string, string>>>>;
export declare function loopPresetImage(presetId: string, itemId: string): string | null;
export declare const LOOP_PRESETS: LoopPreset[];
