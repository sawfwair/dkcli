// @vitest-environment node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as core from '@dkcli/core';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import * as cli from './index.ts';

const modules = ['audit', 'color', 'compose', 'design', 'interaction', 'layout', 'palette', 'perception', 'saliency', 'scale', 'types', 'ease', 'fit', 'future-text', 'future', 'glass', 'jerk', 'linebreak', 'optical', 'typography', 'typeset', 'perfect', 'loop-presets'];

describe('shared public algorithms', () => {
  it('retains only public API bridges in the CLI source', () => {
    const declarations = modules.flatMap((module) => {
      const path = fileURLToPath(new URL(`./${module}.ts`, import.meta.url));
      const parsed = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
      return parsed.statements.filter((statement) => !ts.isExportDeclaration(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== '@dkcli/core').map((statement) => `${module}: ${statement.getText(parsed)}`);
    });
    expect(declarations).toEqual([]);
  });

  it('exposes the public algorithms through the CLI entry point', () => {
    for (const name of ['apcaContrast', 'optimizePalette', 'analyzeDistinctness', 'generateScale', 'generateFibonacciScale', 'generateFluidScale', 'generateSpring', 'generateMinimumJerk', 'getCorrections', 'generateGlassCss', 'recommendTypography', 'typesetParagraph', 'balanceLines', 'flowLinesByWidth', 'analyzeEmbeddingTopologyHeuristic', 'analyzeSemanticTypesetParagraph', 'compilePerfectProof', 'verifyPerfectProof', 'verifyContainment', 'audit', 'solveDesignLayout'] as const) {
      expect(cli[name], `CLI ${name}`).toBe(core[name]);
    }
  });

  it('shares corrected Fibonacci and circle outputs with public core', () => {
    const fibonacci = core.generateFibonacciScale({ down: 6, steps: 2, unit: 'px' });
    expect(fibonacci.scale[0].px).toBe(2);
    expect(cli.generateFibonacciScale({ down: 6, steps: 2, unit: 'px' })).toEqual(fibonacci);

    const circle = core.getCorrections('circle', 100);
    expect(circle.corrections).toEqual([
      { property: 'width', value: '112px', reason: 'Circle size after correction from 100 px' },
      { property: 'height', value: '112px', reason: 'Circle size after correction from 100 px' }
    ]);
    expect(cli.getCorrections('circle', 100)).toEqual(circle);
  });
});
