import { describe, expect, it } from 'vitest';
import { assertProjectQualificationMatches, assertQualificationOptionsMatch, qualificationArtifactFingerprint, validateQualificationOptions, validateProjectQualificationReceipt, type ProjectQualificationReceipt } from './qualification.ts';
import { createThemeProject, projectIdentity } from './project.ts';

const project = createThemeProject({ id: 'receipt-test', theme: { name: 'Test', seed: { color: '#336699', mode: 'light', density: 'comfortable', ratio: 'perfect-fourth', motion: 'calm' }, fonts: { body: 'sans-serif', display: 'sans-serif', mono: 'monospace' } }, viewports: [320] });
async function receipt(): Promise<ProjectQualificationReceipt> {
  return { schemaVersion: 1, createdAt: '2026-10-04T12:00:00.000Z', projectIdentity: await projectIdentity(project), artifactFingerprint: 'a'.repeat(64), status: 'passed', browser: { provider: 'local-chromium', version: '123', userAgent: 'Chromium' }, viewports: [320], fonts: { requested: project.theme.fonts, ready: true, loaded: [] }, mathematics: { fixtureCount: 1, failedCount: 0, unsupportedCount: 0, components: [{ component: 'button', fixtureCount: 1, failedCaseIds: [], unsupportedCaseIds: [] }] }, measurements: [{ component: 'button', caseId: 'playground-default', axes: { size: 'md' }, state: { disabled: false }, viewport: { width: 320, height: 960 }, checks: [{ kind: 'overflow', status: 'pass', message: 'No measured overflow.' }], geometry: [{ selector: '#button', bounds: { x: 0, y: 0, width: 100, height: 44 }, clientWidth: 100, scrollWidth: 100, textOverflow: false, containerOverflow: false, fontFamily: 'sans-serif', fontSize: '16px' }], screenshot: { mediaType: 'image/jpeg', data: '/9j/', width: 100, height: 44 } }], coverage: { componentCount: 1, caseCount: 1, widthCount: 1, untested: [], unsupported: [] } };
}
describe('portable qualification receipts', () => {
  it.each([{ browser: ['firefox'] }, { colorScheme: ['dark'] }])('rejects JSON arrays in scalar qualification options %j', (options) => {
    expect(validateQualificationOptions(options).valid).toBe(false);
  });

  it.each(['status', 'provider', 'check status', 'font status', 'color scheme', 'zoom mode'])('rejects JSON arrays in scalar receipt %s', async (field) => {
    const value = await receipt();
    const malformed = field === 'status' ? { ...value, status: ['passed'] }
      : field === 'provider' ? { ...value, browser: { ...value.browser, provider: ['local-chromium'] } }
      : field === 'check status' ? { ...value, measurements: [{ ...value.measurements[0], checks: [{ ...value.measurements[0].checks[0], status: ['pass'] }] }] }
      : field === 'font status' ? { ...value, fonts: { ...value.fonts, loaded: [{ family: 'ABeeZee', status: ['loaded'] }] } }
      : { ...value, environment: { colorScheme: field === 'color scheme' ? ['light'] : 'light', zoom: 1, zoomMode: field === 'zoom mode' ? ['none'] : 'none', dpr: 1 } };
    expect(validateProjectQualificationReceipt(malformed).valid).toBe(false);
  });

  it('accepts complete declared case coverage independently of dictionary insertion order', async () => {
    const value = await receipt();
    value.measurements[0].state = { disabled: false, query: '' };
    value.coverage.declaredCases = [{ component: 'button', caseId: 'playground-default', axes: { size: 'md' }, state: { query: '', disabled: false }, requiredChecks: ['overflow'] }];
    expect(validateProjectQualificationReceipt(value).valid).toBe(true);
    expect(() => assertQualificationOptionsMatch(value, { browser: 'chromium', cases: ['button:playground-default'] })).not.toThrow();
    value.coverage.declaredCases.push(value.coverage.declaredCases[0]);
    expect(validateProjectQualificationReceipt(value).valid).toBe(false);
  });

  it('rejects an undeclared measurement and returns validation errors for malformed declared-scene measurements', async () => {
    const value = await receipt();
    value.coverage.declaredCases = [{ component: 'button', caseId: 'release-disabled', axes: { size: 'md' }, state: { disabled: true }, requiredChecks: ['overflow'] }];
    value.status = 'incomplete';
    value.coverage.untested.push('button:release-disabled was not captured.');
    expect(validateProjectQualificationReceipt(value).valid).toBe(false);
    value.coverage.declaredCases[0] = { component: 'button', caseId: 'playground-default', axes: { size: 'md' }, state: { disabled: false }, requiredChecks: ['overflow'] };
    const malformed = { ...value, measurements: [{ ...value.measurements[0], axes: undefined }] };
    expect(() => validateProjectQualificationReceipt(malformed)).not.toThrow();
    expect(validateProjectQualificationReceipt(malformed).valid).toBe(false);
  });

  it('requires the recorded same-origin font fixture to be loaded before a passing verdict', async () => {
    const value = await receipt();
    value.environment = { colorScheme: 'light', zoom: 1, zoomMode: 'none', dpr: 1, fontFixture: 'release-sans-v1' };
    expect(validateProjectQualificationReceipt(value).valid).toBe(false);
    value.status = 'incomplete';
    value.fonts.loaded = [{ family: 'ABeeZee', status: 'error' }];
    expect(validateProjectQualificationReceipt(value).valid).toBe(true);
    value.status = 'passed';
    value.fonts.loaded = [{ family: '"ABeeZee"', status: 'loaded' }];
    expect(validateProjectQualificationReceipt(value).valid).toBe(true);
  });

  it('bounds explicit scene batches and rejects unsupported options without substituting defaults', () => {
    expect(validateQualificationOptions({ browser: 'firefox', colorScheme: 'dark', zoom: 2, cases: ['button:release-disabled'], fontFixture: 'release-sans-v1' }).valid).toBe(true);
    for (const options of [
      { cases: [] },
      { cases: Array.from({ length: 13 }, (_, index) => `button:case-${index}`) },
      { cases: ['button:rest', 'button:rest'] },
      { timeout: 10000 },
      { browser: 'safari' },
      { colorScheme: 'sepia' },
      { zoom: 3 },
      { fontFixture: 'arbitrary-font' }
    ]) expect(validateQualificationOptions(options).valid).toBe(false);
  });

  it('requires every declared scene at every recorded width instead of accepting a partial passing matrix', async () => {
    const value = await receipt();
    const declarations = [
      { component: 'button', caseId: 'playground-default', axes: { size: 'md' }, state: { disabled: false }, requiredChecks: ['overflow'] },
      { component: 'button', caseId: 'release-disabled', axes: { size: 'md' }, state: { disabled: true }, requiredChecks: ['overflow'] }
    ];
    const declared = { ...value, coverage: { ...value.coverage, declaredCases: declarations } };
    expect(validateProjectQualificationReceipt(declared).valid).toBe(false);
    declared.status = 'incomplete';
    declared.coverage.untested.push('button:release-disabled at 320px was not captured.');
    expect(validateProjectQualificationReceipt(declared).valid).toBe(true);
  });

  it('rejects a declared state mismatch and refuses a pass when a required interaction was not checked', async () => {
    const value = await receipt();
    const declarations = [{ component: 'button', caseId: 'playground-default', axes: { size: 'md' }, state: { disabled: true }, requiredChecks: ['overflow'] }];
    const declared = { ...value, coverage: { ...value.coverage, declaredCases: declarations } };
    expect(validateProjectQualificationReceipt(declared).valid).toBe(false);
    declarations[0].state.disabled = false;
    declarations[0].requiredChecks.push('keyboard');
    expect(validateProjectQualificationReceipt(declared).valid).toBe(false);
    declared.status = 'incomplete';
    declared.coverage.untested.push('button:playground-default keyboard was not checked at 320px.');
    expect(validateProjectQualificationReceipt(declared).valid).toBe(true);
  });

  it('records additional browser engines and explicit CSS zoom without changing old receipts', async () => {
    const value = await receipt();
    for (const provider of ['local-firefox', 'local-webkit']) {
      const expanded = { ...value, browser: { ...value.browser, provider }, environment: { colorScheme: 'dark', zoom: 2, zoomMode: 'css', dpr: 1 } };
      expect(validateProjectQualificationReceipt(expanded).valid).toBe(true);
    }
    expect(validateProjectQualificationReceipt(value).valid).toBe(true);
  });

  it.each([
    { colorScheme: 'sepia', zoom: 1, zoomMode: 'none', dpr: 1 },
    { colorScheme: 'dark', zoom: 2, zoomMode: 'none', dpr: 1 },
    { colorScheme: 'light', zoom: 1, zoomMode: 'none', dpr: NaN },
    { colorScheme: 'light', zoom: 1, zoomMode: 'none', dpr: 0 },
    { colorScheme: 'light', zoom: 1, zoomMode: 'none', dpr: 1, fontFixture: 'unknown-font' }
  ])('rejects invalid or misleading environment evidence %j', async (environment) => {
    expect(validateProjectQualificationReceipt({ ...await receipt(), environment }).valid).toBe(false);
  });

  it('binds evidence to content, package digests, fonts, and widths while ignoring font key insertion order', async () => {
    const value = await receipt();
    value.fonts.requested = { mono: 'monospace', display: 'sans-serif', body: 'sans-serif' };
    expect(validateProjectQualificationReceipt(value).valid).toBe(true);
    await expect(assertProjectQualificationMatches(project, value, 'a'.repeat(64))).resolves.toEqual(value);
    await expect(assertProjectQualificationMatches({ ...project, theme: { ...project.theme, name: 'Changed' } }, value)).rejects.toThrow('different project');
    await expect(assertProjectQualificationMatches(project, value, 'b'.repeat(64))).rejects.toThrow('different package');
  });
  it('accepts an empty search query in a measured command-palette default state', async () => {
    const value = await receipt(); value.measurements[0].state.query = '';
    expect(validateProjectQualificationReceipt(value).valid).toBe(true);
  });
  it('rejects forged passing statuses for failed bounds, missing screenshots, untested interactions, and incomplete widths', async () => {
    for (const change of [(value: ProjectQualificationReceipt) => { value.measurements[0].geometry[0].containerOverflow = true; }, (value: ProjectQualificationReceipt) => { delete value.measurements[0].screenshot; }, (value: ProjectQualificationReceipt) => { value.coverage.untested.push('dialog focus'); }, (value: ProjectQualificationReceipt) => { value.viewports.push(768); }]) {
      const value = await receipt(); change(value); expect(validateProjectQualificationReceipt(value).valid).toBe(false);
    }
  });
  it('rejects non-finite geometry, oversized screenshots, duplicate scenes, and inconsistent mathematical totals', async () => {
    for (const change of [(value: ProjectQualificationReceipt) => { value.measurements[0].geometry[0].bounds.width = Infinity; }, (value: ProjectQualificationReceipt) => { value.measurements[0].screenshot!.data = 'A'.repeat(45000); }, (value: ProjectQualificationReceipt) => { value.measurements.push(value.measurements[0]); }, (value: ProjectQualificationReceipt) => { value.mathematics.failedCount = 1; }]) {
      const value = await receipt(); change(value); expect(validateProjectQualificationReceipt(value).valid).toBe(false);
    }
  });
  it('accepts explicit incomplete evidence and requires failed status when a measured or mathematical check fails', async () => {
    const value = await receipt(); value.status = 'incomplete'; value.coverage.untested.push('other states'); expect(validateProjectQualificationReceipt(value).valid).toBe(true);
    value.measurements[0].checks[0].status = 'fail'; expect(validateProjectQualificationReceipt(value).valid).toBe(false);
    value.status = 'failed'; expect(validateProjectQualificationReceipt(value).valid).toBe(true);
  });
  it('produces the prepared-tarball fingerprint independently of manifest insertion order', async () => {
    const left = { core: { sha256: 'a'.repeat(64) }, tokens: { sha256: 'b'.repeat(64) } };
    expect(await qualificationArtifactFingerprint(left)).toBe(await qualificationArtifactFingerprint({ tokens: left.tokens, core: left.core }));
    await expect(qualificationArtifactFingerprint({ core: { sha256: 'source-path' } })).rejects.toThrow('Invalid package');
  });
});
