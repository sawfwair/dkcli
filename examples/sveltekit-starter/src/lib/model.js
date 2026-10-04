import { RATIOS } from '@dkcli/core';

/** @typedef {{ id: string, title: string, owner: string, environment: 'Staging'|'Production', status: 'In review'|'Ready'|'Archived' }} Release */
/** @typedef {{ name: string, seed: { color: `#${string}`, mode: 'light'|'dark', density: 'comfortable'|'compact', ratio: number, motion: 'snappy' } }} ThemeConfig */

/** @type {ThemeConfig} */
export const DEFAULT_THEME = {
  name: 'Mineral',
  seed: { color: '#ba4d25', mode: 'light', density: 'comfortable', ratio: 1.25, motion: 'snappy' }
};

/** @type {Release[]} */
export const INITIAL_RELEASES = [
  { id: 'RL-104', title: 'Atlas · spring collection', owner: 'Nina Park', environment: 'Production', status: 'In review' },
  { id: 'RL-103', title: 'Field notes · search', owner: 'Rafi Chen', environment: 'Staging', status: 'Ready' },
  { id: 'RL-102', title: 'Studio · color editor', owner: 'Casey Morgan', environment: 'Staging', status: 'In review' },
  { id: 'RL-101', title: 'Archive · winter collection', owner: 'Nina Park', environment: 'Production', status: 'Archived' }
];

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

/** Accept a workbench ThemeContract or a minimal {name,seed}; regenerate its tokens. @param {unknown} value @returns {ThemeConfig|null} */
export function parseTheme(value) {
  if (!isRecord(value) || !isRecord(value.seed)) return null;
  const { name, seed } = value;
  const ratio = typeof seed.ratio === 'number' ? seed.ratio : typeof seed.ratio === 'string' && Object.hasOwn(RATIOS, seed.ratio) ? RATIOS[seed.ratio] : NaN;
  if (typeof name !== 'string' || !name.trim() || name.length > 64 || /[<>]/.test(name) || [...name].some((char) => char.charCodeAt(0) < 32) || /^dk-.*-default$/i.test(name.trim())) return null;
  if (typeof seed.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(seed.color)) return null;
  if (seed.mode !== 'light' && seed.mode !== 'dark') return null;
  if (seed.density !== 'comfortable' && seed.density !== 'compact') return null;
  if (!Number.isFinite(ratio) || ratio < 1.05 || ratio > 2) return null;
  return { name: name.trim(), seed: { color: /** @type {`#${string}`} */ (seed.color.toLowerCase()), mode: seed.mode, density: seed.density, ratio, motion: 'snappy' } };
}

/** @param {string|undefined} raw @returns {ThemeConfig} */
export function readTheme(raw) {
  try { return parseTheme(JSON.parse(raw ?? 'null')) ?? DEFAULT_THEME; } catch { return DEFAULT_THEME; }
}

/** @param {unknown} row @returns {row is Release} */
function isRelease(row) {
  return isRecord(row) && typeof row.id === 'string' && /^RL-\d{1,12}$/.test(row.id)
    && typeof row.title === 'string' && row.title.length > 0 && row.title.length <= 64
    && typeof row.owner === 'string' && row.owner.length > 0 && row.owner.length <= 40
    && (row.environment === 'Staging' || row.environment === 'Production')
    && (row.status === 'In review' || row.status === 'Ready' || row.status === 'Archived');
}

/** @param {string|undefined} raw @returns {Release[]} */
export function readReleases(raw) {
  try {
    const rows = /** @type {unknown} */ (JSON.parse(raw ?? 'null'));
    if (!Array.isArray(rows) || rows.length > 8 || !rows.every(isRelease)) return INITIAL_RELEASES.map((row) => ({ ...row }));
    if (new Set(rows.map((row) => row.id)).size !== rows.length) return INITIAL_RELEASES.map((row) => ({ ...row }));
    return rows;
  } catch { return INITIAL_RELEASES.map((row) => ({ ...row })); }
}

/** @param {FormData} data @returns {{ fields: {title:string,owner:string,environment:string}, errors: Record<string,string> }} */
export function validateRelease(data) {
  const text = (/** @type {string} */ key) => typeof data.get(key) === 'string' ? String(data.get(key)).trim() : '';
  const fields = { title: text('title'), owner: text('owner'), environment: text('environment') };
  /** @type {Record<string,string>} */
  const errors = {};
  if (!fields.title || fields.title.length > 64) errors.title = 'Enter a release name from 1 to 64 characters.';
  if (!fields.owner || fields.owner.length > 40) errors.owner = 'Enter an owner name from 1 to 40 characters.';
  if (!['Staging', 'Production'].includes(fields.environment)) errors.environment = 'Choose Staging or Production.';
  return { fields, errors };
}

/** Bound the percent-encoded cookie, including Unicode input. @param {Release[]} rows @returns {boolean} */
export function fitsReleaseCookie(rows) { return encodeURIComponent(JSON.stringify(rows)).length <= 3500; }
