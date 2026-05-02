export type HierarchyItem = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  children?: HierarchyItem[];
};

export type FlatHierarchyItem<T extends HierarchyItem = HierarchyItem> = {
  id: string;
  item: T;
  depth: number;
  parentId?: string;
  expanded: boolean;
  hasChildren: boolean;
};

export function toggleExpandedIds(current: string[], id: string): string[] {
  return current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
}

export function flattenHierarchy(
  items: HierarchyItem[],
  expandedIds: string[],
  depth = 0,
  parentId?: string
): FlatHierarchyItem[] {
  const flattened: FlatHierarchyItem[] = [];

  for (const item of items) {
    const hasChildren = Boolean(item.children?.length);
    const expanded = hasChildren && expandedIds.includes(item.id);
    flattened.push({
      id: item.id,
      item,
      depth,
      parentId,
      expanded,
      hasChildren
    });
    if (hasChildren && expanded) {
      flattened.push(...flattenHierarchy(item.children ?? [], expandedIds, depth + 1, item.id));
    }
  }

  return flattened;
}

export function nextVisibleHierarchyIndex(
  items: FlatHierarchyItem[],
  currentIndex: number,
  key: string
): number {
  if (items.length === 0) {
    return 0;
  }

  switch (key) {
    case 'ArrowUp':
      return currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    case 'ArrowDown':
      return currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
    case 'Home':
      return 0;
    case 'End':
      return items.length - 1;
    default:
      return currentIndex;
  }
}
