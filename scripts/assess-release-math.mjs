/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const categories = ['contrast', 'distinctness', 'target', 'layout', 'helperText', 'optionRow', 'anchoredSurface', 'motion'];
const identityFields = ['componentId', 'id', 'name', 'caseKey', 'axes', 'states', 'props', 'sampleText'];

function object(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`Expected ${label} object.`);
  return value;
}
function array(value, label) {
  if (!Array.isArray(value)) throw new Error(`Expected ${label} array.`);
  return value;
}
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (typeof value === 'object' && value !== null) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
  return value;
}
function same(actual, expected, message) {
  if (JSON.stringify(normalized(actual)) !== JSON.stringify(normalized(expected))) throw new Error(message);
}
function identity(fixture) { return Object.fromEntries(identityFields.filter((key) => fixture[key] !== undefined).map((key) => [key, fixture[key]])); }
function key(fixture) { return `${fixture.componentId}:${fixture.id}`; }
function layoutSignature(proof) {
  return Object.fromEntries(['target', 'widths', 'heights', 'estimatedInlinePx', 'requiredBlockPx', 'widthChecks', 'pass'].map((key) => [key, proof[key]]));
}

/** Checks the exact reviewed project findings without changing mathematical verdicts. */
export function assertReviewedProjectMath(value, policy) {
  const report = object(value, 'project report');
  const expected = object(policy.project, 'reviewed project');
  same(report.evidence, policy.evidence, 'Project evidence scope changed.');
  for (const field of ['projectIdentity', 'projectId', 'revision', 'viewports']) same(report[field], expected[field], `Reviewed project ${field} changed.`);
  const fixtures = array(report.fixtures, 'project fixtures');
  const inventory = array(expected.fixtureInventory, 'reviewed inventory');
  const reviewed = array(expected.reviewedFailures, 'reviewed failures');
  const expectedById = new Map(inventory.map((fixture) => [key(fixture), fixture]));
  const failuresById = new Map(reviewed.map((fixture) => [key(fixture), fixture]));
  if (expectedById.size !== 180 || failuresById.size !== 17 || fixtures.length !== 180) throw new Error('Preserve the reviewed 180-fixture inventory and 17 findings.');
  const observed = new Set();
  const observedFailures = new Set();
  for (const value of fixtures) {
    const fixture = object(value, 'fixture');
    const id = key(fixture);
    const baseline = expectedById.get(id);
    if (!baseline || observed.has(id)) throw new Error(`Unexpected or duplicate fixture ${id}.`);
    observed.add(id);
    same(identity(fixture), identity(baseline), `Reviewed case inputs changed for ${id}.`);
    if (fixture.evidence !== 'mathematical' || fixture.resolved !== true || fixture.coverage?.complete !== true) throw new Error(`Unresolved or incomplete proof ${id}.`);
    same(fixture.coverage.unsupported, [], `Unsupported proof ${id}.`);
    same(fixture.coverage.declared, baseline.declared, `Declared proof scope changed for ${id}.`);
    same(fixture.coverage.evaluated, baseline.declared, `Unevaluated proof ${id}.`);
    for (const category of categories) {
      const proofs = array(fixture[category], `${id} ${category}`);
      if (proofs.length !== baseline.proofCounts[category]) throw new Error(`Proof count changed for ${id} ${category}.`);
      if (category !== 'layout' && proofs.some((proof) => proof.pass !== true)) throw new Error(`Unreviewed ${category} failure for ${id}.`);
    }
    const reviewedFailure = failuresById.get(id);
    const failedLayout = fixture.layout.filter((proof) => proof.pass !== true);
    if (reviewedFailure) {
      same(failedLayout.map(layoutSignature), reviewedFailure.layout.map(layoutSignature), `Reviewed layout checks changed for ${id}.`);
      if (fixture.pass !== false) throw new Error(`Reviewed finding ${id} must remain a mathematical failure.`);
      observedFailures.add(id);
    } else if (failedLayout.length || fixture.pass !== true) throw new Error(`Unreviewed mathematical failure ${id}.`);
  }
  same([...observedFailures].sort(), [...failuresById.keys()].sort(), 'Reviewed failure identities changed.');
  const summary = object(report.summary, 'project summary');
  same(summary, expected.summary, 'Project totals must retain 180 fixtures, 17 findings, and a failed mathematical verdict.');
  const expectedRuns = new Map(expected.runs.map((run) => [run.slug, run]));
  const runs = array(report.runs, 'project runs');
  const runIds = new Set();
  if (runs.length !== 38 || expectedRuns.size !== 38) throw new Error('Preserve all 38 reviewed project component runs.');
  for (const run of runs) {
    if (!expectedRuns.has(run.slug) || runIds.has(run.slug)) throw new Error(`Unexpected or duplicate project run ${run.slug}.`);
    runIds.add(run.slug);
    same(run, expectedRuns.get(run.slug), `Reviewed project verdicts changed for ${run.slug}.`);
  }
  return { fixtureCount: fixtures.length, reviewedFailureCount: observedFailures.size, mathematicalPass: false };
}

/** Preserves the exact reviewed component-theme failures, including their check reasons. */
export function assertReviewedMatrix(value, policy) {
  const report = object(value, 'matrix report');
  const expected = object(policy.matrix, 'reviewed matrix');
  for (const field of ['evidence', 'components', 'themes', 'summary']) same(report[field], expected[field], `Reviewed matrix ${field} changed.`);
  const byId = new Map(array(expected.runs, 'reviewed runs').map((run) => [`${run.themeId}:${run.slug}`, run]));
  const runs = array(report.runs, 'matrix runs');
  if (byId.size !== 152 || runs.length !== 152) throw new Error('Preserve all 152 reviewed component-theme runs.');
  const seen = new Set();
  for (const value of runs) {
    const run = object(value, 'matrix run');
    const id = `${run.themeId}:${run.slug}`;
    if (!byId.has(id) || seen.has(id)) throw new Error(`Unexpected or duplicate matrix run ${id}.`);
    seen.add(id);
    same(run, byId.get(id), `Reviewed matrix verdicts changed for ${id}.`);
  }
  return { fixtureCount: 720, reviewedFailureCount: 45, mathematicalPass: false };
}

function strictArtifact(executable, args, cwd) {
  const env = { ...process.env };
  delete env.NODE_PATH;
  const result = spawnSync(process.execPath, [executable, ...args, '--json', '--strict'], { cwd, env, encoding: 'utf8', timeout: 90_000, maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 1 || !/strict verification failed/.test(result.stderr)) throw new Error(`Strict mathematical verification must fail after emitting its artifact: ${result.error?.message ?? result.stderr}`);
  return object(JSON.parse(result.stdout), 'strict artifact');
}

export function assessReleaseMath(repositoryRoot = root) {
  const policy = JSON.parse(readFileSync(join(repositoryRoot, 'qualification/reviewed-math-policy.json'), 'utf8'));
  const input = readFileSync(join(repositoryRoot, 'qualification/original-project.json'));
  if (createHash('sha256').update(input).digest('hex') !== policy.project.inputSha256) throw new Error('Original qualification project content changed; review a new project explicitly.');
  const dist = join(repositoryRoot, 'dist');
  if (!existsSync(join(dist, 'bin/dk.js'))) throw new Error('Build the public CLI before assessing mathematical release findings.');
  const consumer = mkdtempSync(join(tmpdir(), 'dkcli-math-assessment-'));
  try {
    cpSync(dist, join(consumer, 'dist'), { recursive: true });
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
    writeFileSync(join(consumer, 'project.json'), input);
    const executable = join(consumer, 'dist/bin/dk.js');
    const project = assertReviewedProjectMath(strictArtifact(executable, ['project', 'verify', '--input=project.json'], consumer), policy);
    const matrix = assertReviewedMatrix(strictArtifact(executable, ['components', 'matrix'], consumer), policy);
    return { scope: 'reviewed-mathematical-findings', evidence: 'mathematical', rendered: 'not-collected', project, matrix };
  } finally { rmSync(consumer, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(`${JSON.stringify(assessReleaseMath(), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; }
}
