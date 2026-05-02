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
export declare function toggleExpandedIds(current: string[], id: string): string[];
export declare function flattenHierarchy(items: HierarchyItem[], expandedIds: string[], depth?: number, parentId?: string): FlatHierarchyItem[];
export declare function nextVisibleHierarchyIndex(items: FlatHierarchyItem[], currentIndex: number, key: string): number;
