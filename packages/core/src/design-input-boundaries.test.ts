import { describe, expect, it } from 'vitest';
import { analyzeImportance } from './saliency.ts';
import { solveDesignLayout } from './layout.ts';
import { scoreDesignComposition } from './compose.ts';
import type { DesignDocument, DesignRole } from './design.ts';

function document(): DesignDocument {
  return { frame: { width: 960, height: 640 }, elements: [{ id: 'title', kind: 'text', role: 'title', x: 32, y: 32, width: 220, height: 48 }] };
}

describe('design-document admission', () => {
  it.each([
    { frame: { width: Number.NaN, height: 640 } },
    { frame: { width: 960, height: 640, columns: Number.NaN } },
    { elements: [{ ...document().elements[0], importance: Number.NaN }] },
    { elements: [{ ...document().elements[0], role: 'toString' as DesignRole }] }
  ])('rejects malformed geometry or scoring inputs before output %j', (change) => {
    const input = { ...document(), ...change };
    expect(() => analyzeImportance(input)).toThrow();
    expect(() => solveDesignLayout(input)).toThrow();
    expect(() => scoreDesignComposition(input)).toThrow();
  });
});
