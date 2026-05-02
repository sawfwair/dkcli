export type CommandItem = {
  id: string;
  label: string;
  section?: string;
  shortcut?: string;
  keywords?: string[];
  disabled?: boolean;
};

export type GroupedCommandItems = {
  section: string;
  items: CommandItem[];
};

export function filterCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) => {
    const haystack = [item.label, item.section ?? '', ...(item.keywords ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function groupCommandItems(items: CommandItem[]): GroupedCommandItems[] {
  const grouped = new Map<string, CommandItem[]>();

  for (const item of items) {
    const section = item.section ?? 'Commands';
    const bucket = grouped.get(section) ?? [];
    bucket.push(item);
    grouped.set(section, bucket);
  }

  return [...grouped.entries()].map(([section, groupItems]) => ({
    section,
    items: groupItems
  }));
}

export function firstEnabledCommandIndex(items: CommandItem[]): number {
  const index = items.findIndex((item) => !item.disabled);
  return index === -1 ? 0 : index;
}
