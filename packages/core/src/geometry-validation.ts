import { assertFiniteOutput, assertNonnegativeFinite, assertPositiveFinite } from './numeric-validation.ts';
import type { DesignDocument } from './design.ts';

export function assertFrame(frame: { width: number; height: number }): void {
  assertPositiveFinite(frame.width, 'Frame width');
  assertPositiveFinite(frame.height, 'Frame height');
  assertFiniteOutput(frame.width * frame.height, 'Frame area');
}

export function assertRectangles(items: Array<{ id: string; x: number; y: number; width: number; height: number }>): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id || ids.has(item.id)) throw new Error('Rectangle IDs must be nonempty and distinct.');
    ids.add(item.id);
    assertFiniteOutput(item.x, 'Rectangle x');
    assertFiniteOutput(item.y, 'Rectangle y');
    assertNonnegativeFinite(item.width, 'Rectangle width');
    assertNonnegativeFinite(item.height, 'Rectangle height');
    assertFiniteOutput(item.x + item.width, 'Rectangle right edge');
    assertFiniteOutput(item.y + item.height, 'Rectangle bottom edge');
    assertFiniteOutput(item.width * item.height, 'Rectangle area');
  }
}

export function assertDesignDocument(document: DesignDocument): void {
  assertFrame(document.frame);
  assertRectangles(document.elements);
  assertNonnegativeFinite(document.frame.padding ?? 32, 'Document padding');
  assertNonnegativeFinite(document.frame.gap ?? 20, 'Document gap');
  const columns = document.frame.columns ?? 12;
  if (!Number.isSafeInteger(columns) || columns < 1) throw new Error('Document columns must be a positive safe integer.');
  if (document.frame.mode !== undefined && document.frame.mode !== 'flow' && document.frame.mode !== 'app-shell') throw new Error('Document mode must be flow or app-shell.');
  const roles = ['hero', 'title', 'body', 'caption', 'cta', 'support', 'meta', 'eyebrow', 'image', 'data'];
  for (const element of document.elements) {
    if (element.role !== undefined && !roles.includes(element.role)) throw new Error(`Unknown document role "${element.role}".`);
    if (!['text', 'image', 'shape', 'group'].includes(element.kind)) throw new Error(`Unknown document element kind "${element.kind}".`);
    for (const key of ['minWidth', 'preferredWidth', 'maxWidth', 'minHeight', 'preferredHeight', 'maxHeight'] as const) {
      if (element[key] !== undefined) assertNonnegativeFinite(element[key], `Document ${key}`);
    }
    if (element.fontSize !== undefined) assertPositiveFinite(element.fontSize, 'Document font size');
    if (element.fontWeight !== undefined) assertPositiveFinite(element.fontWeight, 'Document font weight');
    if (element.importance !== undefined) assertFiniteOutput(element.importance, 'Document importance');
    if (element.priority !== undefined) assertFiniteOutput(element.priority, 'Document priority');
  }
  const regions = [...document.background?.safeRegions ?? [], ...(document.background?.subjectRegion ? [document.background.subjectRegion] : [])];
  assertRectangles(regions.map((region, index) => ({ ...region, id: `region-${index}` })));
}
