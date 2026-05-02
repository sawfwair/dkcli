import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scanRoot = path.join(repoRoot, 'src');
const ignoredFiles = new Set([path.join(scanRoot, 'lib/dk/index.ts')]);
const bannedPatterns = [
  /from ['"]\.\/(?:layout|compose|interaction|design|audit|saliency)(?:\.ts)?['"]/g,
  /from ['"]\.\.\/(?:layout|compose|interaction|design|audit|saliency)(?:\.ts)?['"]/g
] as const;

function walk(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(resolved));
      continue;
    }
    if (resolved.endsWith('.ts')) {
      files.push(resolved);
    }
  }

  return files;
}

describe('root source import cutover', () => {
  it('does not import migrated dk modules from local source files', () => {
    const offending = walk(scanRoot)
      .filter((file) => !ignoredFiles.has(file))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        const matches = bannedPatterns.flatMap((pattern) => source.match(pattern) ?? []);
        return matches.length > 0 ? [{ file: path.relative(repoRoot, file), matches }] : [];
      });

    expect(offending).toEqual([]);
  });
});
