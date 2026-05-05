const CSS_CUSTOM_PROPERTY_RE = /^--[a-zA-Z0-9_-]+$/;
const CSS_CUSTOM_PROPERTY_BODY_RE = /^[a-zA-Z0-9_-]+$/;
const CSS_UNSAFE_VALUE_RE = /[;{}]|\/\*|\*\//;

function cssContext(label?: string): string {
  return label ? ` for ${label}` : '';
}

export function assertSafeCssCustomPropertyName(name: string, label?: string): string {
  if (!CSS_CUSTOM_PROPERTY_RE.test(name)) {
    throw new Error(`Unsafe CSS custom property name${cssContext(label)}: ${name}`);
  }
  return name;
}

export function assertSafeCssCustomPropertyBody(name: string, label?: string): string {
  if (!CSS_CUSTOM_PROPERTY_BODY_RE.test(name)) {
    throw new Error(`Unsafe CSS custom property name${cssContext(label)}: ${name}`);
  }
  return name;
}

export function assertSafeCssValue(value: string | number, label?: string): string {
  const text = String(value);
  if (CSS_UNSAFE_VALUE_RE.test(text) || hasControlCharacter(text) || /\burl\s*\(/i.test(text)) {
    throw new Error(`Unsafe CSS value${cssContext(label)}.`);
  }
  return text;
}

function hasControlCharacter(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function replaceCssCommentControlCharacters(value: string): string {
  return [...value]
    .map((char) => {
      const code = char.charCodeAt(0);
      return code <= 0x1f || code === 0x7f ? ' ' : char;
    })
    .join('');
}

function replaceCssStringControlCharacters(value: string): string {
  return [...value]
    .map((char) => {
      const code = char.charCodeAt(0);
      return code <= 0x08 || code === 0x0b || (code >= 0x0e && code <= 0x1f) || code === 0x7f ? '\\fffd ' : char;
    })
    .join('');
}

export function escapeCssComment(value: string | number): string {
  return replaceCssCommentControlCharacters(String(value).replace(/\*\//g, '* /'));
}

export function escapeCssString(value: string | number): string {
  return replaceCssStringControlCharacters(
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
  )
    .replace(/\n/g, '\\a ')
    .replace(/\r/g, '\\d ')
    .replace(/\f/g, '\\c ');
}
