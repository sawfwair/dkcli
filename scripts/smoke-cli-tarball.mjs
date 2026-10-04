/* eslint-disable @typescript-eslint/explicit-function-return-type */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryDir = mkdtempSync(join(tmpdir(), 'dkcli-tarball-smoke-'));
const packedDir = join(temporaryDir, 'packed');
const consumerDir = join(temporaryDir, 'consumer');
const env = { ...process.env, npm_config_cache: join(temporaryDir, 'npm-cache') };
delete env.NODE_PATH;
delete env.npm_config_link_workspace_packages;

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed:\n${result.error?.message ?? ''}\n${result.stderr}`);
  return result.stdout;
}

function expectedLayoutFailures(slug, themeId) {
  switch (slug) {
    case 'accordion': return [{ name: 'accordion-md-open', caseKey: 'size=md', width: 320 }];
    case 'breadcrumbs': return [{ name: 'breadcrumbs-md', caseKey: 'size=md', width: 220 }];
    case 'button': return [
      ...(themeId === 'linen' ? [] : [{
        name: 'solid-sizes (content=label|size=lg|variant=solid)', caseKey: 'content=label|size=lg|variant=solid', width: 180
      }]),
      { name: 'link-anchor', caseKey: 'content=label|size=md|variant=link', width: 180 }
    ];
    case 'badge': return themeId === 'sage' ? [] : ['soft', 'solid', 'outline'].map((emphasis) => ({
      name: `success-${emphasis}`, caseKey: `emphasis=${emphasis}|size=md|tone=success`, width: 120
    }));
    case 'checkbox': return ['cobalt', 'ember'].includes(themeId)
      ? ['default', 'checked', 'indeterminate'].flatMap((state) => ['sm', 'md', 'lg'].map((size) => ({
        name: `${state} (size=${size})`, caseKey: `size=${size}`, width: 240
      }))) : [];
    case 'text-field': return themeId === 'linen' ? [] : [{ name: 'sizes (size=lg)', caseKey: 'size=lg', width: 240 }];
    default: return [];
  }
}

function assertMathematicalBaseline(report) {
  assert.deepEqual(report.evidence, { kind: 'mathematical', rendered: 'not-collected' });
  assert.deepEqual(report.summary, {
    componentCount: 38, themeCount: 4, runCount: 152, passedRuns: 132,
    fixtureCount: 720, failedFixtureCount: 45, pass: false
  });
  assert.equal(report.runs.length, 152);
  assert.equal(report.runs.filter((run) => !run.pass).length, 20);
  for (const run of report.runs) {
    const expected = expectedLayoutFailures(run.slug, run.themeId).map((failure) => ({
      fixtureName: `${run.themeName} / ${run.name} / ${failure.name}`,
      caseKey: failure.caseKey,
      reasons: [`layout overflow at ${failure.width}px`]
    }));
    assert.deepEqual(run.failures, expected, `${run.themeName} / ${run.name} must preserve its exact mathematical verdicts`);
    assert.equal(run.pass, expected.length === 0);
  }
}

try {
  mkdirSync(packedDir);
  mkdirSync(consumerDir);
  run('npm', ['pack', '--ignore-scripts', '--pack-destination', temporaryDir], root);
  const tarballs = readdirSync(temporaryDir).filter((file) => file.endsWith('.tgz'));
  assert.equal(tarballs.length, 1, 'Expected one CLI tarball');
  run('tar', ['-xzf', join(temporaryDir, tarballs[0]), '-C', packedDir], consumerDir);

  const packageDir = join(packedDir, 'package');
  const packageJson = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  const executable = join(packageDir, packageJson.bin.dk);
  assert.equal(existsSync(join(packageDir, 'src')), false, 'Smoke must use the distributed artifact');
  assert.equal(existsSync(join(packageDir, 'node_modules')), false, 'Smoke must run without workspace dependencies');

  function dk(args, expectedStatus = 0) {
    const result = spawnSync(process.execPath, [executable, ...args], { cwd: consumerDir, env, encoding: 'utf8' });
    assert.equal(result.status, expectedStatus, `dk ${args.join(' ')} failed:\n${result.error?.message ?? ''}\n${result.stderr}`);
    if (expectedStatus === 1) assert.match(result.stderr, /strict verification failed/);
    return result.stdout;
  }

  const verify = JSON.parse(dk(['components', 'verify', '--all', '--json']));
  assert.equal(verify.mode, 'verify');
  assertMathematicalBaseline(verify);
  const strictVerify = JSON.parse(dk(['components', 'verify', '--all', '--json', '--strict'], 1));
  assertMathematicalBaseline(strictVerify);

  const matrix = JSON.parse(dk(['components', 'matrix', '--all', '--json']));
  assert.equal(matrix.mode, 'matrix');
  assertMathematicalBaseline(matrix);
  assert.deepEqual(matrix.summary, verify.summary);
  assert.deepEqual(matrix.components, verify.components);
  assert.deepEqual(matrix.themes, verify.themes);
  assert.match(dk(['components', 'matrix', '--all']), /Summary: \d+\/\d+ runs passed/);

  const strictMatrix = JSON.parse(dk(['components', '--strict', 'matrix', '--all', '--json'], 1));
  assertMathematicalBaseline(strictMatrix);

  const selected = JSON.parse(dk(['components', 'verify', '--name', 'table', '--theme', 'ember', '--json', '--strict']));
  assert.deepEqual(selected.evidence, { kind: 'mathematical', rendered: 'not-collected' });
  assert.equal(selected.summary.runCount, 1);
  assert.equal(selected.summary.pass, true);
  assert.equal(selected.runs[0].slug, 'table');
  assert.equal(selected.runs[0].themeId, 'ember');

  const projectPath = join(consumerDir, 'northstar.dkproject.json');
  const project = JSON.parse(readFileSync(join(root, 'examples/theme-projects/northstar.dkproject.json'), 'utf8'));
  writeFileSync(projectPath, JSON.stringify(project));
  const projectVerify = JSON.parse(dk(['project', 'verify', '--input', projectPath, '--json']));
  assert.equal(projectVerify.summary.componentCount, 38);
  assert.equal(projectVerify.summary.fixtureCount, 180);
  assert.deepEqual(projectVerify.viewports, project.viewports);
  assert.deepEqual(projectVerify.evidence, { kind: 'mathematical', rendered: 'not-collected' });
  assert.match(projectVerify.projectIdentity, /^[a-f0-9]{64}$/);
  assert.ok(projectVerify.summary.failedFixtureCount > 0, 'Authored project must keep its declared estimate failures');
  const strictProject = JSON.parse(dk(['project', 'verify', '--input', projectPath, '--json', '--strict'], 1));
  assert.equal(strictProject.projectIdentity, projectVerify.projectIdentity);
  assert.deepEqual(strictProject.summary, projectVerify.summary);
  const patchPath = join(consumerDir, 'radius.patch.json');
  writeFileSync(patchPath, JSON.stringify({ schemaVersion: 1, id: 'adjust-radius', title: 'Adjust control radius',
    projectIdentity: projectVerify.projectIdentity, changes: [{ family: 'radius', token: 'md', before: '8px', after: '10px' }] }));
  const revisedPath = join(consumerDir, 'revised.dkproject.json');
  const revised = JSON.parse(dk(['project', 'patch', '--input', projectPath, '--patch', patchPath, '--output', revisedPath, '--json']));
  assert.equal(revised.revision, 2);
  assert.equal(revised.theme.overrides.radius.md, '10px');
  assert.equal(revised.history[0].theme.overrides.radius.md, '8px');
  assert.deepEqual(JSON.parse(readFileSync(revisedPath, 'utf8')), revised);
  const revisedVerify = JSON.parse(dk(['project', 'verify', '--input', revisedPath, '--json']));
  assert.notEqual(revisedVerify.projectIdentity, projectVerify.projectIdentity);
  assert.equal(JSON.parse(readFileSync(projectPath, 'utf8')).revision, 1);

  writeFileSync(join(consumerDir, 'app.css'), '.card { padding: 16px; gap: 8px; font-size: 16px; line-height: 1.5; }\n');
  const commands = [
    ['perfect', '--seed', '#D96F32', '--ratio', 'perfect-fourth', '--motion', 'snappy'],
    ['palette', '#D96F32', '--harmony', 'split-complementary'],
    ['scale', '--fluid', '--ratio', 'perfect-fourth', '--base-min', '15', '--base-max', '19'],
    ['text', '--font', '18', '--measure', '680', '--contrast', '72'],
    ['audit', '--css', 'app.css']
  ];
  for (const args of commands) {
    const output = JSON.parse(dk([...args, '--json']));
    assert.ok(Object.keys(output).length > 0, `${args[0]} must emit its JSON result`);
    if (args[0] === 'perfect') {
      assert.deepEqual(output.evidence, { kind: 'mathematical', rendered: 'not-collected' });
      assert.ok(output.report.diagnostics.length > 0);
      assert.equal(output.report.diagnostics.some((diagnostic) => diagnostic.stage === 'render'), false);
      assert.equal(output.report.ok, output.report.failCount === 0);
    }
    if (args[0] === 'audit') {
      assert.deepEqual(output.evidence, { kind: 'source-heuristic', rendered: 'not-collected' });
      assert.deepEqual(output.verification, { pass: false, unsupported: ['contrast'], failures: [] });
    }
  }
  const perfect = JSON.parse(dk(['perfect', '--seed', '#295dff', '--json', '--strict'], 1));
  assert.equal(perfect.report.ok, false);
  assert.ok(perfect.report.failures.some((failure) => failure.id === 'compile.distinct.deutan'));
  assert.ok(perfect.tokens.primaryHex);
  const unresolvedAudit = JSON.parse(dk(['audit', '--css', 'app.css', '--json', '--strict'], 1));
  assert.deepEqual(unresolvedAudit.verification.unsupported, ['contrast']);
  writeFileSync(join(consumerDir, 'readable.css'), '.label { color: #111111; background: #ffffff; font-size: 16px; }\n');
  const readableAudit = JSON.parse(dk(['audit', '--css', 'readable.css', '--json', '--strict']));
  assert.equal(readableAudit.verification.pass, true);
  assert.deepEqual(readableAudit.verification.unsupported, []);
  const help = dk(['--help']);
  assert.match(help, /Usage:/);
  assert.match(help, /components/);
  console.log(`${packageJson.name}: standalone tarball smoke passed (${verify.summary.componentCount} components, ${verify.summary.themeCount} themes, ${verify.summary.fixtureCount} mathematical fixtures with ${verify.summary.failedFixtureCount} known estimate failures; portable project verify/strict/patch; ${commands.length} documented commands; strict artifact gates checked)`);
} finally {
  rmSync(temporaryDir, { recursive: true, force: true });
}
