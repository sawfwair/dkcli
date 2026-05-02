export type SelectableItem = {
  value: string;
  disabled?: boolean;
};

export function findSelectedItem<T extends SelectableItem>(items: T[], value: string | undefined): T | undefined {
  return items.find((item) => item.value === value);
}

export function firstEnabledValue<T extends SelectableItem>(items: T[]): string | undefined {
  return items.find((item) => !item.disabled)?.value;
}

export function nextSelectableValue<T extends SelectableItem>(
  items: T[],
  currentValue: string | undefined,
  direction: 1 | -1
): string | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const currentIndex = currentValue ? items.findIndex((item) => item.value === currentValue) : -1;
  for (let offset = 1; offset <= items.length; offset += 1) {
    const index = (currentIndex + offset * direction + items.length) % items.length;
    const candidate = items[index];
    if (candidate && !candidate.disabled) {
      return candidate.value;
    }
  }

  return currentValue;
}
