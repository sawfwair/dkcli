import type { Action } from 'svelte/action';

type RequiredSelectionState = {
  required: boolean;
  disabled: boolean;
  value: string | undefined;
};

/** Validates the committed value, independently of editable search text. */
export const requiredSelection: Action<HTMLInputElement, RequiredSelectionState> = (input, state) => {
  function update(next: RequiredSelectionState): void {
    input.setCustomValidity(next.required && !next.disabled && !next.value ? 'Select an option.' : '');
  }

  update(state);
  return { update, destroy: () => input.setCustomValidity('') };
};
