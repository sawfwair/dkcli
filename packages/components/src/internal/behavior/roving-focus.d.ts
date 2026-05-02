export type RovingItem = {
    disabled?: boolean;
};
export declare function moveRovingIndex(items: RovingItem[], currentIndex: number, key: string, orientation?: 'horizontal' | 'vertical'): number;
export declare function firstEnabledIndex(items: RovingItem[]): number;
export declare function lastEnabledIndex(items: RovingItem[]): number;
