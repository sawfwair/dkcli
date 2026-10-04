import { canonicalProjectJson, hashProjectValue, projectIdentity, type ThemeProject, type ProjectFonts } from './project.ts';

export type QualificationStatus = 'passed' | 'failed' | 'incomplete';
export type QualificationCheckStatus = 'pass' | 'fail' | 'untested' | 'unsupported';
export type QualificationOptions = {
  browser?: 'chromium' | 'firefox' | 'webkit';
  colorScheme?: 'light' | 'dark';
  /** Uses CSS zoom, where 1 means 100% and 2 means 200%; browser UI zoom is not measured. */
  zoom?: 1 | 2;
  cases?: string[];
  fontFixture?: 'release-sans-v1';
};
export type QualificationEnvironment = {
  colorScheme: 'light' | 'dark'; zoom: 1 | 2; zoomMode: 'css' | 'none'; dpr: number;
  fontFixture?: 'release-sans-v1';
};
export type QualificationDeclaredCase = {
  component: string; caseId: string; axes: Record<string, string>; state: Record<string, string | boolean>;
  requiredChecks: string[];
};
export type QualificationBounds = { x: number; y: number; width: number; height: number };
export type QualificationCheck = { kind: string; status: QualificationCheckStatus; message: string; selector?: string };
export type QualificationGeometry = {
  selector: string; bounds: QualificationBounds; clientWidth: number; scrollWidth: number;
  textOverflow: boolean; containerOverflow: boolean; fontFamily: string; fontSize: string;
};
export type QualificationMeasurement = {
  component: string; caseId: string; axes: Record<string, string>; state: Record<string, string | boolean>;
  viewport: { width: number; height: number }; checks: QualificationCheck[]; geometry: QualificationGeometry[];
  screenshot?: { mediaType: 'image/jpeg'; data: string; width: number; height: number };
};
/** Unsigned producer evidence, scoped to the listed scenes, widths, checks, and artifacts. */
export type ProjectQualificationReceipt = {
  schemaVersion: 1; createdAt: string; projectIdentity: string; artifactFingerprint: string; status: QualificationStatus;
  browser: { provider: 'local-chromium' | 'local-firefox' | 'local-webkit' | 'cloudflare-browser'; version: string; userAgent: string };
  environment?: QualificationEnvironment;
  viewports: number[];
  fonts: { requested: ProjectFonts; ready: boolean; loaded: { family: string; status: string }[] };
  mathematics: { fixtureCount: number; failedCount: number; unsupportedCount: number; components: {
    component: string; fixtureCount: number; failedCaseIds: string[]; unsupportedCaseIds: string[];
  }[] };
  measurements: QualificationMeasurement[];
  coverage: { componentCount: number; caseCount: number; widthCount: number; untested: string[]; unsupported: string[]; declaredCases?: QualificationDeclaredCase[] };
};
export const MAX_QUALIFICATION_BYTES = 2 * 1024 * 1024;
export const MAX_QUALIFICATION_SCREENSHOT_BYTES = 32 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const statuses = ['pass', 'fail', 'untested', 'unsupported'];
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function text(value: unknown, max = 1000): value is string { return typeof value === 'string' && value.length > 0 && value.length <= max; }
function enumString(value: unknown, allowed: readonly string[]): boolean { return typeof value === 'string' && allowed.includes(value); }
function count(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 100000; }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.length <= 5000 && value.every((item) => text(item)); }
function widths(value: unknown): value is number[] { return Array.isArray(value) && value.length > 0 && value.length <= 6 && value.every((width) => Number.isInteger(width) && width >= 320 && width <= 2000) && new Set(value).size === value.length; }
function fonts(value: unknown): value is ProjectFonts { return record(value) && ['body', 'display', 'mono'].every((key) => text(value[key], 200)); }
function dictionary(value: unknown, booleans = false): boolean { return record(value) && Object.keys(value).length <= 40 && Object.entries(value).every(([key, item]) => text(key, 100) && (text(item, 200) || (booleans && (typeof item === 'boolean' || (typeof item === 'string' && item.length <= 200))))); }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1000000; }
function geometry(value: unknown): value is QualificationGeometry {
  return record(value) && text(value.selector, 1000) && record(value.bounds) && ['x', 'y', 'width', 'height'].every((key) => finite(value.bounds && record(value.bounds) ? value.bounds[key] : undefined)) && Number(value.bounds.width) >= 0 && Number(value.bounds.height) >= 0 && finite(value.clientWidth) && value.clientWidth >= 0 && finite(value.scrollWidth) && value.scrollWidth >= 0 && typeof value.textOverflow === 'boolean' && typeof value.containerOverflow === 'boolean' && text(value.fontFamily, 500) && text(value.fontSize, 100);
}
/** Validates bounded, explicit runtime selections without silently substituting a browser or case. */
export function validateQualificationOptions(value: unknown): { valid: true; options: QualificationOptions } | { valid: false; errors: string[] } {
  if (!record(value)) return { valid: false, errors: ['Use a qualification options object.'] };
  const errors: string[] = [];
  if (Object.keys(value).some((key) => !['browser', 'colorScheme', 'zoom', 'cases', 'fontFixture'].includes(key))) errors.push('Use supported qualification options.');
  if (value.browser !== undefined && !enumString(value.browser, ['chromium', 'firefox', 'webkit'])) errors.push('Choose chromium, firefox, or webkit.');
  if (value.colorScheme !== undefined && !enumString(value.colorScheme, ['light', 'dark'])) errors.push('Choose light or dark color scheme.');
  if (value.zoom !== undefined && value.zoom !== 1 && value.zoom !== 2) errors.push('Choose CSS zoom 1 or 2.');
  if (value.fontFixture !== undefined && value.fontFixture !== 'release-sans-v1') errors.push('Use font fixture release-sans-v1.');
  if (value.cases !== undefined && (!strings(value.cases) || value.cases.length < 1 || value.cases.length > 12 || new Set(value.cases).size !== value.cases.length || value.cases.some((id) => !/^[a-z0-9-]+:[A-Za-z0-9_-]+$/.test(id)))) errors.push('Select 1 to 12 distinct component:caseId scenes.');
  return errors.length ? { valid: false, errors } : { valid: true, options: structuredClone(value) as QualificationOptions };
}
/** Validates bounded evidence and prevents a passing status from hiding recorded failures or gaps. */
export function validateProjectQualificationReceipt(value: unknown): { valid: true; receipt: ProjectQualificationReceipt } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ['Use a qualification receipt object.'] };
  try { if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_QUALIFICATION_BYTES) errors.push('Keep the qualification receipt within 2 MiB.'); } catch { return { valid: false, errors: ['Use serializable qualification evidence.'] }; }
  if (value.schemaVersion !== 1 || !text(value.createdAt, 40) || !/^\d{4}-\d\d-\d\dT/.test(value.createdAt) || !Number.isFinite(Date.parse(value.createdAt))) errors.push('Provide receipt version 1 and an ISO timestamp.');
  if (typeof value.projectIdentity !== 'string' || !HASH.test(value.projectIdentity) || typeof value.artifactFingerprint !== 'string' || !HASH.test(value.artifactFingerprint)) errors.push('Provide SHA-256 project and artifact identities.');
  if (!enumString(value.status, ['passed', 'failed', 'incomplete'])) errors.push('Use a supported receipt status.');
  if (!record(value.browser) || !enumString(value.browser.provider, ['local-chromium', 'local-firefox', 'local-webkit', 'cloudflare-browser']) || !text(value.browser.version, 200) || !text(value.browser.userAgent, 1000)) errors.push('Identify the browser provider, version, and user agent.');
  if (value.environment !== undefined) {
    const environment = value.environment;
    if (!record(environment) || !enumString(environment.colorScheme, ['light', 'dark']) || (environment.zoom !== 1 && environment.zoom !== 2) || !enumString(environment.zoomMode, ['css', 'none']) || (environment.zoom === 2 && environment.zoomMode !== 'css') || !finite(environment.dpr) || environment.dpr <= 0 || environment.dpr > 8 || (environment.fontFixture !== undefined && environment.fontFixture !== 'release-sans-v1')) errors.push('Record light or dark color scheme, CSS zoom, positive device pixel ratio, and supported font fixture.');
  }
  if (!widths(value.viewports)) errors.push('Record 1 to 6 distinct widths from 320 to 2000 pixels.');
  if (!record(value.fonts) || !fonts(value.fonts.requested) || typeof value.fonts.ready !== 'boolean' || !Array.isArray(value.fonts.loaded) || value.fonts.loaded.length > 100 || !value.fonts.loaded.every((face) => record(face) && text(face.family, 200) && enumString(face.status, ['loaded', 'loading', 'unloaded', 'error']))) errors.push('Record requested fonts, readiness, and loaded font faces.');
  let failed = false; let gaps = false;
  const math = value.mathematics;
  if (!record(math) || !count(math.fixtureCount) || !count(math.failedCount) || !count(math.unsupportedCount) || !Array.isArray(math.components) || math.components.length > 100) errors.push('Record mathematical fixture coverage.');
  else {
    let total = 0; let failTotal = 0; let unsupportedTotal = 0; const seen = new Set<string>();
    for (const item of math.components) {
      if (!record(item) || !text(item.component, 100) || !count(item.fixtureCount) || !strings(item.failedCaseIds) || !strings(item.unsupportedCaseIds)) { errors.push('Use valid mathematical component results.'); continue; }
      if (seen.has(item.component) || new Set(item.failedCaseIds).size !== item.failedCaseIds.length || new Set(item.unsupportedCaseIds).size !== item.unsupportedCaseIds.length || item.failedCaseIds.length > item.fixtureCount || item.unsupportedCaseIds.length > item.fixtureCount) errors.push('Use distinct component and mathematical case identities.');
      seen.add(item.component); total += item.fixtureCount; failTotal += item.failedCaseIds.length; unsupportedTotal += item.unsupportedCaseIds.length;
    }
    if (total !== math.fixtureCount || failTotal !== math.failedCount || unsupportedTotal !== math.unsupportedCount) errors.push('Mathematical totals must match component results.');
    failed ||= math.failedCount > 0; gaps ||= math.unsupportedCount > 0;
  }
  const seen = new Set<string>(); const components = new Set<string>(); const cases = new Set<string>(); const measuredWidths = new Set<number>();
  if (!Array.isArray(value.measurements) || value.measurements.length > 600) errors.push('Provide at most 600 measured scenes.');
  else for (const measurement of value.measurements) {
    if (!record(measurement) || !text(measurement.component, 100) || !text(measurement.caseId, 256) || !dictionary(measurement.axes) || !dictionary(measurement.state, true) || !record(measurement.viewport) || !Number.isInteger(measurement.viewport.width) || !Array.isArray(value.viewports) || !value.viewports.includes(measurement.viewport.width) || !Number.isInteger(measurement.viewport.height) || Number(measurement.viewport.height) < 320 || Number(measurement.viewport.height) > 4000 || !Array.isArray(measurement.checks) || measurement.checks.length > 100 || !Array.isArray(measurement.geometry) || measurement.geometry.length > 200) { errors.push('Use measured scene identities, recorded viewports, checks, and geometry.'); continue; }
    const identity = `${measurement.component}:${measurement.caseId}:${measurement.viewport.width}`;
    if (seen.has(identity)) errors.push('Measure each component case and width once.');
    seen.add(identity); components.add(measurement.component); cases.add(`${measurement.component}:${measurement.caseId}`); measuredWidths.add(Number(measurement.viewport.width));
    if (!measurement.checks.length || !measurement.geometry.length) gaps = true;
    for (const check of measurement.checks) {
      if (!record(check) || !text(check.kind, 100) || !enumString(check.status, statuses) || !text(check.message) || (check.selector !== undefined && !text(check.selector))) { errors.push('Use named checks with explicit statuses and messages.'); continue; }
      failed ||= check.status === 'fail'; gaps ||= check.status === 'untested' || check.status === 'unsupported';
    }
    if (!measurement.geometry.every(geometry)) errors.push('Record finite bounds, widths, overflow, and computed fonts.');
    else failed ||= measurement.geometry.some((item) => item.textOverflow || item.containerOverflow);
    if (measurement.screenshot !== undefined) {
      const screenshot = measurement.screenshot;
      if (!record(screenshot) || screenshot.mediaType !== 'image/jpeg' || !text(screenshot.data, Math.ceil(MAX_QUALIFICATION_SCREENSHOT_BYTES / 3) * 4) || !/^[A-Za-z0-9+/]+={0,2}$/.test(screenshot.data) || !Number.isInteger(screenshot.width) || Number(screenshot.width) < 1 || Number(screenshot.width) > 2000 || !Number.isInteger(screenshot.height) || Number(screenshot.height) < 1 || Number(screenshot.height) > 4000) errors.push('Use JPEG evidence within 32 KiB and record its dimensions.');
    } else gaps = true;
  }
  const coverage = value.coverage;
  if (!record(coverage) || !count(coverage.componentCount) || !count(coverage.caseCount) || !count(coverage.widthCount) || !strings(coverage.untested) || !strings(coverage.unsupported)) errors.push('Record measurement coverage and uncovered work.');
  else {
    if (coverage.componentCount !== components.size || coverage.caseCount !== cases.size || coverage.widthCount !== measuredWidths.size) errors.push('Coverage totals must match measured scenes.');
    gaps ||= coverage.untested.length > 0 || coverage.unsupported.length > 0;
    if (coverage.declaredCases !== undefined) {
      if (!Array.isArray(coverage.declaredCases) || coverage.declaredCases.length < 1 || coverage.declaredCases.length > 600) errors.push('Declare 1 to 600 selected scene identities.');
      else {
        const declared = new Set<string>();
        const measured = Array.isArray(value.measurements) ? value.measurements.filter(record) : [];
        const namedGaps = [...coverage.untested, ...coverage.unsupported];
        for (const item of coverage.declaredCases) {
          if (!record(item) || !text(item.component, 100) || !text(item.caseId, 256) || !dictionary(item.axes) || !dictionary(item.state, true) || !strings(item.requiredChecks) || item.requiredChecks.length < 1 || item.requiredChecks.length > 100 || new Set(item.requiredChecks).size !== item.requiredChecks.length) { errors.push('Declare scene axes, state, and distinct required checks.'); continue; }
          const identity = `${item.component}:${item.caseId}`;
          if (declared.has(identity)) errors.push('Declare each selected component case once.');
          declared.add(identity);
          for (const width of Array.isArray(value.viewports) ? value.viewports : []) {
            const scene = measured.find((scene) => scene.component === item.component && scene.caseId === item.caseId && record(scene.viewport) && scene.viewport.width === width);
            if (!scene) {
              gaps = true;
              if (!namedGaps.some((note) => note.includes(identity))) errors.push(`Name missing ${identity} scene coverage.`);
              continue;
            }
            if (!dictionary(scene.axes) || !dictionary(scene.state, true)) continue;
            if (canonicalProjectJson(scene.axes) !== canonicalProjectJson(item.axes) || canonicalProjectJson(scene.state) !== canonicalProjectJson(item.state)) errors.push(`Measured axes and state differ from declared ${identity}.`);
            const checks = Array.isArray(scene.checks) ? scene.checks.filter(record) : [];
            for (const kind of item.requiredChecks) {
              if (!checks.some((check) => check.kind === kind)) {
                gaps = true;
                if (!namedGaps.some((note) => note.includes(identity) && note.includes(kind))) errors.push(`Name missing ${identity} ${kind} check coverage.`);
              }
            }
          }
        }
        for (const identity of cases) if (!declared.has(identity)) errors.push(`Measured ${identity} was not declared in selected coverage.`);
      }
    }
  }
  if (record(value.environment) && value.environment.fontFixture === 'release-sans-v1') {
    gaps ||= !record(value.fonts) || !Array.isArray(value.fonts.loaded) || !value.fonts.loaded.some((face) => record(face) && text(face.family, 200) && face.family.replaceAll('"', '').replaceAll("'", '') === 'ABeeZee' && face.status === 'loaded');
  }
  gaps ||= !record(value.fonts) || value.fonts.ready !== true || measuredWidths.size !== (Array.isArray(value.viewports) ? value.viewports.length : 0) || seen.size !== cases.size * measuredWidths.size || !seen.size;
  if (value.status === 'passed' && (failed || gaps)) errors.push('A passing receipt cannot contain failures or uncovered checks.');
  if (value.status === 'failed' && !failed) errors.push('A failed receipt must identify a failed check or mathematical fixture.');
  if (value.status === 'incomplete' && failed) errors.push('Use failed status when a recorded check or fixture fails.');
  return errors.length ? { valid: false, errors } : { valid: true, receipt: structuredClone(value) as ProjectQualificationReceipt };
}
/** Checks freshness; identities bind evidence to content and artifacts, not to a trusted producer. */
export async function assertProjectQualificationMatches(project: Pick<ThemeProject, 'schemaVersion' | 'theme' | 'viewports'>, value: unknown, artifactFingerprint?: string): Promise<ProjectQualificationReceipt> {
  const result = validateProjectQualificationReceipt(value);
  if (!result.valid) throw new Error(result.errors.join(' '));
  const receipt = result.receipt;
  if (receipt.projectIdentity !== await projectIdentity(project)) throw new Error('Qualification belongs to different project content.');
  if (JSON.stringify(receipt.viewports) !== JSON.stringify(project.viewports)) throw new Error('Qualification widths differ from the project.');
  if (['body', 'display', 'mono'].some((key) => receipt.fonts.requested[key as keyof ProjectFonts] !== project.theme.fonts[key as keyof ProjectFonts])) throw new Error('Qualification fonts differ from the project.');
  if (artifactFingerprint !== undefined && receipt.artifactFingerprint !== artifactFingerprint) throw new Error('Qualification belongs to different package artifacts.');
  return receipt;
}
/** Rejects evidence that silently substitutes explicitly requested runtime selections. */
export function assertQualificationOptionsMatch(receipt: ProjectQualificationReceipt, options: QualificationOptions): void {
  const selected = validateQualificationOptions(options);
  if (!selected.valid) throw new Error(selected.errors.join(' '));
  if (options.browser !== undefined) {
    const providers = options.browser === 'chromium' ? ['local-chromium', 'cloudflare-browser'] : [`local-${options.browser}`];
    if (!providers.includes(receipt.browser.provider)) throw new Error('Qualification browser differs from the requested engine.');
  }
  if (options.colorScheme !== undefined && receipt.environment?.colorScheme !== options.colorScheme) throw new Error('Qualification color scheme differs from the requested environment.');
  if (options.zoom !== undefined && receipt.environment?.zoom !== options.zoom) throw new Error('Qualification CSS zoom differs from the requested environment.');
  if (options.fontFixture !== undefined && receipt.environment?.fontFixture !== options.fontFixture) throw new Error('Qualification font fixture differs from the requested environment.');
  if (options.cases !== undefined) {
    const declared = receipt.coverage.declaredCases?.map((item) => `${item.component}:${item.caseId}`).sort();
    if (JSON.stringify(declared) !== JSON.stringify([...options.cases].sort())) throw new Error('Qualification declared scenes differ from the requested cases.');
  }
}
/** Matches the workbench fingerprint: SHA-256 of sorted package-name/digest pairs. */
export async function qualificationArtifactFingerprint(packages: Record<string, { sha256: string }>): Promise<string> {
  const entries = Object.entries(packages).map(([name, entry]) => {
    if (!HASH.test(entry.sha256)) throw new Error(`Invalid package digest for ${name}.`);
    return [name, entry.sha256];
  }).sort(([left], [right]) => left.localeCompare(right, 'en'));
  if (!entries.length) throw new Error('Provide package artifact digests.');
  return hashProjectValue(entries);
}
