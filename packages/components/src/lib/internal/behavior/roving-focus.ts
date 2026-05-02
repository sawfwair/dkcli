export type RovingItem = {
  disabled?: boolean;
};

export function moveRovingIndex(
  items: RovingItem[],
  currentIndex: number,
  key: string,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number {
  if (items.length === 0) {
    return -1;
  }

  const nextKeys = orientation === 'horizontal' ? ['ArrowRight'] : ['ArrowDown'];
  const prevKeys = orientation === 'horizontal' ? ['ArrowLeft'] : ['ArrowUp'];

  if (key === 'Home') {
    return firstEnabledIndex(items);
  }
  if (key === 'End') {
    return lastEnabledIndex(items);
  }
  if (!nextKeys.includes(key) && !prevKeys.includes(key)) {
    return currentIndex;
  }

  const direction: 1 | -1 = nextKeys.includes(key) ? 1 : -1;
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (currentIndex + offset * direction + items.length) % items.length;
    if (!items[index]?.disabled) {
      return index;
    }
  }

  return currentIndex;
}

export function firstEnabledIndex(items: RovingItem[]): number {
  return items.findIndex((item) => !item.disabled);
}

export function lastEnabledIndex(items: RovingItem[]): number {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (!items[index]?.disabled) {
      return index;
    }
  }
  return -1;
}
