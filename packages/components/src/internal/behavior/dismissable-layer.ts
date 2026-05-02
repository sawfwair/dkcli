export function isEventOutside(root: HTMLElement | null, target: EventTarget | null): boolean {
  if (!root || !(target instanceof Node)) {
    return true;
  }
  return !root.contains(target);
}

export function shouldDismissLayer(input: {
  event: Event;
  root: HTMLElement | null;
  trigger?: HTMLElement | null;
  closeOnEscape?: boolean;
  closeOnOutsidePress?: boolean;
}): boolean {
  const {
    event,
    root,
    trigger = null,
    closeOnEscape = true,
    closeOnOutsidePress = true
  } = input;

  if (event instanceof KeyboardEvent) {
    return closeOnEscape && event.key === 'Escape';
  }

  if (!closeOnOutsidePress) {
    return false;
  }

  const outsideRoot = isEventOutside(root, event.target);
  const outsideTrigger = isEventOutside(trigger, event.target);
  return outsideRoot && outsideTrigger;
}
