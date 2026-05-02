export type ToggleState = {
    open: boolean;
    disabled?: boolean;
};
export declare function resolveToggleOpen(input: ToggleState): boolean;
export declare function nextToggleState(current: boolean, disabled?: boolean): boolean;
export declare function coerceBoolean(value: boolean | undefined, fallback?: boolean): boolean;
