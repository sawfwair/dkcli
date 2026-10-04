// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('keeps public parity tests independent of a private sibling checkout', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const file = fileURLToPath(new URL('./math-parity.test.ts', import.meta.url));
  const parsed = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const outside: string[] = [];
  function visit(node: ts.Node): void {
    if (ts.isStringLiteral(node) && /^\.{1,2}\//.test(node.text)) {
      const target = relative(root, resolve(dirname(file), node.text));
      if (target === '..' || target.startsWith(`..${sep}`)) outside.push(node.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  expect(outside).toEqual([]);
});
