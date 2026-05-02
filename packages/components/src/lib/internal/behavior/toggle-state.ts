export type ToggleState = {
  open: boolean;
  disabled?: boolean;
};

export function resolveToggleOpen(input: ToggleState): boolean {
  return Boolean(input.open) && !input.disabled;
}

export function nextToggleState(current: boolean, disabled: boolean = false): boolean {
  return disabled ? current : !current;
}

export function coerceBoolean(value: boolean | undefined, fallback: boolean = false): boolean {
  return value ?? fallback;
}
