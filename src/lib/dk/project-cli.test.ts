// @vitest-environment node
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { MAX_QUALIFICATION_BYTES, type ProjectQualificationReceipt } from '@dkcli/core';
import { runCli, type CliIO } from './cli.ts';
import { isRecord } from '../json-boundary.ts';

const project = {
  schemaVersion: 1, id: 'northstar', revision: 1,
  theme: {
    name: 'Northstar',
    seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
    fonts: { body: 'system-ui, sans-serif', display: 'Georgia, serif', mono: 'monospace' }
  },
  viewports: [320, 768, 1280], history: [], reviews: []
};

const failedProject = {
  ...project,
  theme: { ...project.theme, overrides: { color: { primary: '#ffffff', 'on-primary': '#ffffff' } } }
};

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, current: unknown) => isRecord(current)
    ? Object.fromEntries(Object.keys(current).sort().map((key) => [key, current[key]])) : current);
}
function identityFor(input: typeof project): string {
  return createHash('sha256').update(canonical({ schemaVersion: input.schemaVersion, theme: input.theme, viewports: input.viewports })).digest('hex');
}
const identity = identityFor(project);

type Capture = { io: CliIO & { writeFile: (filePath: string, value: string) => Promise<void> }; writes: Record<string, string>; readonly stdout: string; readonly stderr: string };
function capture(files: Record<string, string> = {}): Capture {
  let stdout = '';
  let stderr = '';
  const writes: Record<string, string> = {};
  const io: CliIO & { writeFile: (filePath: string, value: string) => Promise<void> } = {
    cwd: '/virtual', executableName: 'dk',
    stdout: (value) => { stdout += value; }, stderr: (value) => { stderr += value; },
    readFile: (filePath) => Promise.resolve(files[filePath] ?? ''),
    readStdin: () => Promise.resolve(''),
    writeFile: (filePath, value) => { writes[filePath] = value; return Promise.resolve(); }
  };
  return { io, writes, get stdout() { return stdout; }, get stderr() { return stderr; } };
}

function object(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Expected a JSON object.');
  return value;
}
function artifact(value: string): Record<string, unknown> {
  const result: unknown = JSON.parse(value);
  return object(result);
}

describe('portable project CLI', () => {
  it('verifies all 38 shipped components and retains declared widths with the recorded widths', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    expect(await runCli(['project', 'verify', '--input', 'project.json', '--json'], output.io)).toBe(0);
    const result = artifact(output.stdout);
    expect(result.projectIdentity).toBe(identity);
    expect(result.evidence).toEqual({ kind: 'mathematical', rendered: 'not-collected' });
    const summary = object(result.summary);
    expect(summary.componentCount).toBe(38);
    expect(summary.fixtureCount).toBe(180);
    expect(summary.failedFixtureCount).toBe(0);
    expect(summary.pass).toBe(true);
    const fixtures = result.fixtures;
    expect(Array.isArray(fixtures)).toBe(true);
    if (!Array.isArray(fixtures)) throw new Error('Expected mathematical fixtures.');
    const widthChecks = fixtures.flatMap((fixture: unknown) => {
      const layout = object(fixture).layout;
      if (!Array.isArray(layout)) throw new Error('Expected layout proofs.');
      return layout.flatMap((proof: unknown) => {
        const checks = object(proof).widthChecks;
        if (!Array.isArray(checks)) throw new Error('Expected per-width checks.');
        return checks.map((check: unknown) => object(check));
      });
    });
    expect(widthChecks.map((check) => check.width)).toEqual(expect.arrayContaining([320, 768, 1280]));
    expect(widthChecks.some((check) => typeof check.width === 'number' && check.width < 320)).toBe(true);
    expect(widthChecks.every((check) => check.pass === true)).toBe(true);
  });

  it('emits the complete math artifact with a strict success for the reviewed theme', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    expect(await runCli(['project', 'verify', '--input=project.json', '--format=json', '--strict'], output.io)).toBe(0);
    expect(object(artifact(output.stdout).summary)).toMatchObject({ componentCount: 38, fixtureCount: 180, failedFixtureCount: 0, pass: true });
    expect(output.stderr).toBe('');
  });

  it('emits the complete math artifact before a real contrast failure exits strictly', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(failedProject) });
    expect(await runCli(['project', 'verify', '--input=project.json', '--format=json', '--strict'], output.io)).toBe(1);
    const result = artifact(output.stdout);
    expect(object(result.summary).componentCount).toBe(38);
    expect(object(result.summary).failedFixtureCount).toBeGreaterThan(0);
    if (!Array.isArray(result.fixtures)) throw new Error('Expected mathematical fixtures.');
    const contrast = result.fixtures.flatMap((fixture: unknown) => {
      const checks = object(fixture).contrast;
      if (!Array.isArray(checks)) throw new Error('Expected contrast proofs.');
      return checks.map((check: unknown) => object(check));
    });
    expect(contrast.some((check) => check.pass === false && check.lc === 0 && check.foreground === check.background)).toBe(true);
    expect(output.stderr).toContain('strict verification failed');
    expect(output.stderr).toContain('contrast');
  });

  it('applies a matching override patch while retaining the previous revision', async () => {
    const patch = { schemaVersion: 1, id: 'radius-adjustment', title: 'Adjust radius', projectIdentity: identity, changes: [{ family: 'radius', token: 'md', before: null, after: '8px' }] };
    const output = capture({ '/virtual/project.json': JSON.stringify(project), '/virtual/patch.json': JSON.stringify(patch) });
    expect(await runCli(['project', 'patch', '--input', 'project.json', '--patch', 'patch.json', '--output', 'updated.json'], output.io)).toBe(0);
    const updated = artifact(output.writes['/virtual/updated.json']);
    expect(updated.revision).toBe(2);
    expect(object(object(object(updated.theme).overrides).radius).md).toBe('8px');
    expect(updated.history).toEqual([expect.objectContaining({ revision: 1, theme: project.theme, label: 'Adjust radius' })]);
    expect(artifact(output.stdout)).toEqual(updated);
    expect(JSON.parse(JSON.stringify(project))).toEqual(project);
  });

  it('rejects an identity mismatch without writing an output project', async () => {
    const patch = { schemaVersion: 1, id: 'stale', title: 'Stale patch', projectIdentity: '0'.repeat(64), changes: [{ family: 'radius', token: 'md', before: null, after: '8px' }] };
    const output = capture({ '/virtual/project.json': JSON.stringify(project), '/virtual/patch.json': JSON.stringify(patch) });
    expect(await runCli(['project', 'patch', '--input=project.json', '--patch=patch.json', '--output=updated.json'], output.io)).toBe(1);
    expect(output.writes).toEqual({});
    expect(output.stderr).toContain('different theme');
  });

  it('rejects malformed projects before contacting a runtime', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify({ ...project, viewports: [1] }) });
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173'], output.io)).toBe(1);
    expect(output.stderr).toContain('viewports');
    expect(output.stdout).toBe('');
  });
});


function number(value: unknown): number {
  if (typeof value !== 'number') throw new Error('Expected a number.');
  return value;
}
function string(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Expected a string.');
  return value;
}
const receiptPromises = new Map<string, Promise<ProjectQualificationReceipt>>();
async function makeReceipt(sourceProject = project): Promise<ProjectQualificationReceipt> {
  const sourceIdentity = identityFor(sourceProject);
  let receiptPromise = receiptPromises.get(sourceIdentity);
  if (!receiptPromise) {
    receiptPromise = (async () => {
      const output = capture({ '/virtual/project.json': JSON.stringify(sourceProject) });
      await runCli(['project', 'verify', '--input=project.json', '--json'], output.io);
      const report = artifact(output.stdout);
      if (!Array.isArray(report.fixtures) || !Array.isArray(report.runs)) throw new Error('Expected complete math results.');
      const fixtures = report.fixtures.map((fixture: unknown) => object(fixture));
      const components = report.runs.map((run: unknown) => {
        const item = object(run);
        const slug = string(item.slug);
        const cases = fixtures.filter((fixture) => fixture.componentId === slug);
        return {
          component: slug, fixtureCount: number(item.fixtureCount),
          failedCaseIds: cases.filter((fixture) => fixture.pass === false).map((fixture) => string(fixture.id)),
          unsupportedCaseIds: cases.filter((fixture) => object(fixture.coverage).complete === false).map((fixture) => string(fixture.id))
        };
      });
      const failedCount = components.reduce((sum, component) => sum + component.failedCaseIds.length, 0);
      return {
        schemaVersion: 1, createdAt: '2026-10-04T12:00:00.000Z', projectIdentity: sourceIdentity,
        artifactFingerprint: 'a'.repeat(64), status: failedCount > 0 ? 'failed' : 'incomplete',
        browser: { provider: 'local-chromium', version: '131.0.0', userAgent: 'Qualification test browser' },
        viewports: [...sourceProject.viewports], fonts: { requested: { ...sourceProject.theme.fonts }, ready: true, loaded: [] },
        mathematics: {
          fixtureCount: components.reduce((sum, component) => sum + component.fixtureCount, 0),
          failedCount,
          unsupportedCount: components.reduce((sum, component) => sum + component.unsupportedCaseIds.length, 0), components
        },
        measurements: sourceProject.viewports.map((width) => ({
          component: 'button', caseId: 'rest', axes: { size: 'md' }, state: { rest: true },
          viewport: { width, height: 900 },
          checks: [{ kind: 'overflow', status: 'pass', message: 'The measured button fits its container.' }],
          geometry: [{ selector: 'button', bounds: { x: 0, y: 0, width: 80, height: 44 }, clientWidth: 80, scrollWidth: 80, textOverflow: false, containerOverflow: false, fontFamily: 'system-ui', fontSize: '16px' }],
          screenshot: { mediaType: 'image/jpeg', data: 'aGVsbG8=', width, height: 900 }
        })),
        coverage: { componentCount: 1, caseCount: 1, widthCount: sourceProject.viewports.length, untested: ['Other components have no measured scenes in this test receipt.'], unsupported: [] }
      };
    })();
    receiptPromises.set(sourceIdentity, receiptPromise);
  }
  return structuredClone(await receiptPromise);
}
function respond(output: Capture, receipt: unknown): ReturnType<typeof vi.fn<typeof fetch>> {
  const implementation = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(receipt), { status: 200, headers: { 'content-type': 'application/json' } }));
  output.io.fetch = implementation;
  return implementation;
}

describe('project qualification transport', () => {
  it.each(['browser', 'color-scheme', 'zoom', 'cases', 'font-fixture'])('rejects a bare --%s flag before contacting the runtime', async (name) => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    const request = respond(output, {});
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=https://runtime.example', `--${name}`], output.io)).toBe(1);
    expect(request).not.toHaveBeenCalled();
    expect(output.stdout).toBe('');
    expect(output.stderr).toContain(`Option --${name} requires a value.`);
  });

  it('posts explicit engine, environment, font, and scene selections and accepts matching producer evidence', async () => {
    const receipt = await makeReceipt();
    receipt.browser.provider = 'local-webkit';
    receipt.environment = { colorScheme: 'dark', zoom: 2, zoomMode: 'css', dpr: 1, fontFixture: 'release-sans-v1' };
    receipt.fonts.loaded = [{ family: 'ABeeZee', status: 'loaded' }];
    receipt.coverage.declaredCases = [{ component: 'button', caseId: 'rest', axes: { size: 'md' }, state: { rest: true }, requiredChecks: ['overflow'] }];
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    const request = respond(output, receipt);
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=https://runtime.example', '--browser=webkit', '--color-scheme=dark', '--zoom=2', '--font-fixture=release-sans-v1', '--cases=button:rest', '--json'], output.io)).toBe(0);
    expect(request).toHaveBeenCalledWith('https://runtime.example/api/dk/projects/qualify', expect.objectContaining({
      body: JSON.stringify({ project, options: { browser: 'webkit', colorScheme: 'dark', zoom: 2, cases: ['button:rest'], fontFixture: 'release-sans-v1' } })
    }));
    expect(artifact(output.stdout)).toEqual(receipt);
  });

  it.each(['--browser=firefox', '--color-scheme=dark', '--zoom=2', '--cases=button:release-disabled', '--font-fixture=release-sans-v1'])('rejects silently substituted evidence for %s before emitting an artifact', async (flag) => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    respond(output, await makeReceipt());
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=https://runtime.example', flag, '--json'], output.io)).toBe(1);
    expect(output.stdout).toBe('');
    expect(output.stderr).toMatch(/differs? from the requested/);
  });

  it.each(['--browser=safari', '--color-scheme=sepia', '--zoom=3', '--cases=button:rest,button:rest', '--cases=button', '--font-fixture=unknown'])('rejects invalid selection %s without contacting the runtime', async (flag) => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    const request = respond(output, await makeReceipt());
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=https://runtime.example', flag], output.io)).toBe(1);
    expect(request).not.toHaveBeenCalled();
    expect(output.stdout).toBe('');
  });

  it('posts exact project content with optional bearer authentication and emits a failed receipt before strict exit', async () => {
    const receipt = await makeReceipt(failedProject);
    expect(receipt.mathematics.failedCount).toBeGreaterThan(0);
    const output = capture({ '/virtual/project.json': JSON.stringify(failedProject) });
    const request = respond(output, receipt);
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=https://runtime.example/workbench', '--runtime-token=private-test-token', `--artifact-fingerprint=${receipt.artifactFingerprint}`, '--json', '--strict'], output.io)).toBe(1);
    expect(request).toHaveBeenCalledWith('https://runtime.example/api/dk/projects/qualify', expect.objectContaining({
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer private-test-token' }, body: JSON.stringify({ project: failedProject })
    }));
    expect(artifact(output.stdout)).toEqual(receipt);
    expect(output.stderr).toContain('strict verification failed');
    expect(output.stderr).toContain('mathematical fixture failed');
    expect(output.stdout + output.stderr).not.toContain('private-test-token');
  });

  it('keeps the default artifact exit compatible and identifies provenance as reported by the runtime', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(failedProject) });
    respond(output, await makeReceipt(failedProject));
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173'], output.io)).toBe(0);
    expect(output.stdout).toContain('(reported by runtime)');
    expect(output.stdout).toContain('unsigned runtime claims');
    expect(output.stdout).toContain('Result: failed');
  });

  it.each(['identity', 'fingerprint', 'false pass', 'math coverage'])('rejects mismatched or malformed %s evidence before emitting an artifact', async (kind) => {
    const receipt = await makeReceipt(failedProject);
    if (kind === 'identity') receipt.projectIdentity = '0'.repeat(64);
    if (kind === 'false pass') receipt.status = 'passed';
    if (kind === 'math coverage') {
      const removed = receipt.mathematics.components.pop();
      if (!removed) throw new Error('Expected a component.');
      receipt.mathematics.fixtureCount -= removed.fixtureCount;
      receipt.mathematics.failedCount -= removed.failedCaseIds.length;
      receipt.mathematics.unsupportedCount -= removed.unsupportedCaseIds.length;
    }
    const output = capture({ '/virtual/project.json': JSON.stringify(failedProject) });
    respond(output, receipt);
    const args = ['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173', '--json'];
    if (kind === 'fingerprint') args.push(`--artifact-fingerprint=${'b'.repeat(64)}`);
    expect(await runCli(args, output.io)).toBe(1);
    expect(output.stdout).toBe('');
    expect(output.stderr).toMatch(/different project|different package|passing receipt|all 38/);
  });

  it('accepts equivalent requested fonts independently of JSON property order', async () => {
    const receipt = await makeReceipt();
    receipt.fonts.requested = { mono: project.theme.fonts.mono, display: project.theme.fonts.display, body: project.theme.fonts.body };
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    respond(output, receipt);
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173', '--json'], output.io)).toBe(0);
    expect(artifact(output.stdout)).toEqual(receipt);
  });

  it('requires an explicit runtime even when an environment URL exists', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    output.io.getEnv = () => 'https://implicit.example';
    const request = respond(output, await makeReceipt());
    expect(await runCli(['project', 'qualify', '--input=project.json'], output.io)).toBe(1);
    expect(output.stderr).toContain('explicit qualification runtime');
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects an unsafe override patch before writing the revised project', async () => {
    const patch = { schemaVersion: 1, id: 'invalid-token', title: 'Unknown token', projectIdentity: identity, changes: [{ family: 'radius', token: 'unknown', before: null, after: '8px' }] };
    const output = capture({ '/virtual/project.json': JSON.stringify(project), '/virtual/patch.json': JSON.stringify(patch) });
    expect(await runCli(['project', 'patch', '--input=project.json', '--patch=patch.json', '--output=updated.json'], output.io)).toBe(1);
    expect(output.stderr).toContain('Unknown theme token');
    expect(output.writes).toEqual({});
  });
});


describe('bounded project qualification requests', () => {
  it('bounds receipt streams and cancels oversized bodies before JSON parsing', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(MAX_QUALIFICATION_BYTES + 1))); },
      cancel() { cancelled = true; }
    });
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    output.io.fetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(stream, { status: 200 }));
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173', '--json'], output.io)).toBe(1);
    expect(cancelled).toBe(true);
    expect(output.stderr).toContain('2 MiB');
    expect(output.stdout).toBe('');
  });

  it('caps runtime error details at 1 KiB', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    output.io.fetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(`${'a'.repeat(2048)}private-tail`, { status: 503 }));
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173'], output.io)).toBe(1);
    expect(output.stderr).toContain('503');
    expect(output.stderr).not.toContain('private-tail');
    expect(output.stderr).not.toContain('a'.repeat(1025));
  });

  it('sets an explicit request timeout signal', async () => {
    const output = capture({ '/virtual/project.json': JSON.stringify(project) });
    const request = respond(output, await makeReceipt());
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173', '--json'], output.io)).toBe(0);
    expect(request).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});


describe('portable qualification input', () => {
  it('transmits authored content without saved evidence or private review notes', async () => {
    const receipt = await makeReceipt();
    const review = { component: 'button', caseKey: 'rest', projectIdentity: identity, artifactFingerprint: receipt.artifactFingerprint, verdict: 'up', note: 'Private review note. '.repeat(300), updatedAt: receipt.createdAt };
    const imported = {
      ...project, revision: 2,
      history: [{ revision: 1, theme: project.theme, viewports: project.viewports, createdAt: receipt.createdAt, label: 'Previous revision' }],
      reviews: Array.from({ length: 400 }, () => ({ ...review })),
      qualification: receipt, qualificationHistory: [receipt]
    };
    expect(new TextEncoder().encode(JSON.stringify(imported)).byteLength).toBeGreaterThan(MAX_QUALIFICATION_BYTES);
    const output = capture({ '/virtual/project.json': JSON.stringify(imported) });
    const request = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      const body = typeof init?.body === 'string' ? init.body : '';
      return Promise.resolve(new Response(JSON.stringify(new TextEncoder().encode(body).byteLength > MAX_QUALIFICATION_BYTES ? { error: 'Request exceeds 2 MiB.' } : receipt), { status: new TextEncoder().encode(body).byteLength > MAX_QUALIFICATION_BYTES ? 413 : 200 }));
    });
    output.io.fetch = request;
    expect(await runCli(['project', 'qualify', '--input=project.json', '--runtime-url=http://localhost:4173', '--json'], output.io)).toBe(0);
    const body = request.mock.calls[0][1]?.body;
    expect(typeof body).toBe('string');
    if (typeof body !== 'string') throw new Error('Expected project request JSON.');
    expect(artifact(body)).toEqual({ project: { ...project, revision: 2 } });
    expect(body).not.toContain('Private review');
    expect(body).not.toContain('qualificationHistory');
    expect(body).not.toContain('measurements');
    expect(artifact(output.stdout)).toEqual(receipt);
    expect(imported.reviews).toHaveLength(400);
    expect(imported.qualificationHistory).toEqual([receipt]);
  });
});
