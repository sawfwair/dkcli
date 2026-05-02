export type SelectableItem = {
    value: string;
    disabled?: boolean;
};
export declare function findSelectedItem<T extends SelectableItem>(items: T[], value: string | undefined): T | undefined;
export declare function firstEnabledValue<T extends SelectableItem>(items: T[]): string | undefined;
export declare function nextSelectableValue<T extends SelectableItem>(items: T[], currentValue: string | undefined, direction: 1 | -1): string | undefined;
