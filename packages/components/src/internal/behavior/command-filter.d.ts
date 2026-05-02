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
export declare function filterCommandItems(items: CommandItem[], query: string): CommandItem[];
export declare function groupCommandItems(items: CommandItem[]): GroupedCommandItems[];
export declare function firstEnabledCommandIndex(items: CommandItem[]): number;
