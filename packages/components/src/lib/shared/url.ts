const SAFE_HREF_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function sanitizeHref(href: string | undefined): string | undefined {
  const value = href?.trim();
  if (!value) {
    return undefined;
  }

  if (value.startsWith('#') || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) {
    return value;
  }

  try {
    const parsed = new URL(value);
    return SAFE_HREF_PROTOCOLS.has(parsed.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}
