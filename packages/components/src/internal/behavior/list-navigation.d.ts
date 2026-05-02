import { type RovingItem } from './roving-focus.js';
export type ListNavigationOptions = {
    orientation?: 'horizontal' | 'vertical';
};
export declare function nextListIndex(items: RovingItem[], currentIndex: number, key: string, options?: ListNavigationOptions): number;
