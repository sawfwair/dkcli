export declare function isEventOutside(root: HTMLElement | null, target: EventTarget | null): boolean;
export declare function shouldDismissLayer(input: {
    event: Event;
    root: HTMLElement | null;
    trigger?: HTMLElement | null;
    closeOnEscape?: boolean;
    closeOnOutsidePress?: boolean;
}): boolean;
