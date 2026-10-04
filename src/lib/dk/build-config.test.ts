// @vitest-environment node

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'tsup';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import config from '../../../tsup.config.ts';

const configPath = fileURLToPath(new URL('../../../tsup.config.ts', import.meta.url));

describe('published CLI build configuration', () => {
  it('uses the installed tsup API without semantic TypeScript errors', () => {
    const program = ts.createProgram([configPath], {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      types: ['node']
    });
    const errors = ts.getPreEmitDiagnostics(program)
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

    expect(errors).toEqual([]);
  });

  it('preserves the executable shebang without adding one to the public library', async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), 'dkcli-build-contract-'));
    try {
      if (typeof config === 'function' || Array.isArray(config)) {
        throw new Error('The CLI build contract expects a single static tsup configuration.');
      }
      await build({ ...config, outDir: outputDir, dts: false, silent: true });
      const binary = await readFile(path.join(outputDir, 'bin/dk.js'), 'utf8');
      const library = await readFile(path.join(outputDir, 'lib/dk/index.js'), 'utf8');

      expect(binary.startsWith('#!/usr/bin/env node\n')).toBe(true);
      expect(binary.match(/^#!/gm)).toHaveLength(1);
      expect(library.startsWith('#!')).toBe(false);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});
