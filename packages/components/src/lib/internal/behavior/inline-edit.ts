export type InlineEditState = {
  editing: boolean;
  draft: string;
  committed: string;
};

export function createInlineEditState(value: string): InlineEditState {
  return {
    editing: false,
    draft: value,
    committed: value
  };
}

export function beginInlineEdit(state: InlineEditState): InlineEditState {
  return {
    ...state,
    editing: true,
    draft: state.committed
  };
}

export function commitInlineEdit(state: InlineEditState, nextValue: string): InlineEditState {
  return {
    editing: false,
    draft: nextValue,
    committed: nextValue
  };
}

export function cancelInlineEdit(state: InlineEditState): InlineEditState {
  return {
    editing: false,
    draft: state.committed,
    committed: state.committed
  };
}
