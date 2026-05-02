import { moveRovingIndex, type RovingItem } from './roving-focus.js';

export type ListNavigationOptions = {
  orientation?: 'horizontal' | 'vertical';
};

export function nextListIndex(
  items: RovingItem[],
  currentIndex: number,
  key: string,
  options: ListNavigationOptions = {}
): number {
  return moveRovingIndex(items, currentIndex, key, options.orientation ?? 'vertical');
}
