export type InlineEditState = {
    editing: boolean;
    draft: string;
    committed: string;
};
export declare function createInlineEditState(value: string): InlineEditState;
export declare function beginInlineEdit(state: InlineEditState): InlineEditState;
export declare function commitInlineEdit(state: InlineEditState, nextValue: string): InlineEditState;
export declare function cancelInlineEdit(state: InlineEditState): InlineEditState;
