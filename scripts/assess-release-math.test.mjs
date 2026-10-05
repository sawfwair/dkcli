import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { before, test } from 'node:test';
import { assessReleaseMath, assertReviewedMatrix, assertReviewedProjectMath } from './assess-release-math.mjs';

const root = resolve(import.meta.dirname, '..');
const policy = JSON.parse(readFileSync(join(root, 'qualification/reviewed-math-policy.json'), 'utf8'));
let project;
let matrix;

before(() => {
  for (const [kind, args] of [
    ['project', ['project', 'verify', '--input=qualification/original-project.json']],
    ['matrix', ['components', 'matrix']]
  ]) {
    const result = spawnSync(process.execPath, ['dist/bin/dk.js', ...args, '--json', '--strict'], {
      cwd: root, encoding: 'utf8', timeout: 90_000, maxBuffer: 8 * 1024 * 1024
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    if (kind === 'project') project = JSON.parse(result.stdout);
    else matrix = JSON.parse(result.stdout);
  }
});

test('accepts the exact current project inventory without historical layout failures', () => {
  assert.deepEqual(project.summary, {
    componentCount: 38, themeCount: 1, runCount: 38, passedRuns: 38,
    fixtureCount: 180, failedFixtureCount: 0, pass: true
  });
  assert.deepEqual(assertReviewedProjectMath(project, policy), {
    fixtureCount: 180, reviewedFailureCount: 0, mathematicalPass: true
  });
});

test('accepts all current matrix runs with their actual strict verdict', () => {
  assert.deepEqual(matrix.summary, {
    componentCount: 38, themeCount: 4, runCount: 152, passedRuns: 152,
    fixtureCount: 720, failedFixtureCount: 0, pass: true
  });
  assert.deepEqual(assertReviewedMatrix(matrix, policy), {
    fixtureCount: 720, reviewedFailureCount: 0, mathematicalPass: true
  });
});

test('assesses standalone built artifacts with the passing strict exit status', () => {
  const result = assessReleaseMath(root);
  assert.deepEqual(result.project, { fixtureCount: 180, reviewedFailureCount: 0, mathematicalPass: true });
  assert.deepEqual(result.matrix, { fixtureCount: 720, reviewedFailureCount: 0, mathematicalPass: true });
  assert.equal(result.rendered, 'not-collected');
});

test('rejects new failures, width verdicts, coverage gaps and changed case inputs', () => {
  const failed = structuredClone(project);
  failed.fixtures[0].layout[0].widthChecks[0].fitsWidth = false;
  failed.fixtures[0].layout[0].widthChecks[0].pass = false;
  failed.fixtures[0].layout[0].pass = false;
  failed.fixtures[0].pass = false;
  assert.throws(() => assertReviewedProjectMath(failed, policy), /Unreviewed|layout checks changed/);

  const widthOnly = structuredClone(project);
  widthOnly.fixtures[0].layout[0].widthChecks[0].width += 1;
  assert.throws(() => assertReviewedProjectMath(widthOnly, policy), /layout checks changed/);

  const incomplete = structuredClone(project);
  incomplete.fixtures[0].coverage.complete = false;
  assert.throws(() => assertReviewedProjectMath(incomplete, policy), /incomplete proof/);

  const changed = structuredClone(project);
  changed.fixtures[0].sampleText += ' new content';
  assert.throws(() => assertReviewedProjectMath(changed, policy), /case inputs changed/);

  const matrixFailure = structuredClone(matrix);
  matrixFailure.runs[0].pass = false;
  matrixFailure.runs[0].failures.push('new actual failure');
  assert.throws(() => assertReviewedMatrix(matrixFailure, policy), /matrix verdicts changed/);
});

test('rejects inconsistent strict status even when a passing artifact is emitted', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'dkcli-math-status-'));
  try {
    mkdirSync(join(fixtureRoot, 'qualification'));
    mkdirSync(join(fixtureRoot, 'dist/bin'), { recursive: true });
    writeFileSync(join(fixtureRoot, 'qualification/reviewed-math-policy.json'), JSON.stringify(policy));
    writeFileSync(join(fixtureRoot, 'qualification/original-project.json'), readFileSync(join(root, 'qualification/original-project.json')));
    writeFileSync(join(fixtureRoot, 'dist/package.json'), JSON.stringify({ type: 'module' }));
    writeFileSync(join(fixtureRoot, 'dist/report.json'), JSON.stringify(project));
    writeFileSync(join(fixtureRoot, 'dist/bin/dk.js'), "import { readFileSync } from 'node:fs';\nprocess.stdout.write(readFileSync(new URL('../report.json', import.meta.url)));\nprocess.stderr.write('strict verification failed');\nprocess.exitCode = 1;\n");
    assert.throws(() => assessReleaseMath(fixtureRoot), /Strict exit status disagrees with the mathematical verdict/);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
