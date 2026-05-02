export function portal(node: HTMLElement, target: HTMLElement | undefined = undefined): { destroy(): void } {
  if (typeof document === 'undefined') {
    return { destroy() {} };
  }

  const host = target ?? document.body;
  host.appendChild(node);

  return {
    destroy() {
      node.remove();
    }
  };
}
