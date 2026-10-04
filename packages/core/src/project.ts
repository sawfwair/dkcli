import { assertSafeCssCustomPropertyBody, assertSafeCssValue } from './css-safety.ts';
import { resolveRatio } from './scale.ts';
import type { ThemeSeed } from './component-spec.ts';
import type { ThemeContract, ThemeTokenValue } from './theme-contract.ts';
import { validateProjectQualificationReceipt, type ProjectQualificationReceipt } from './qualification.ts';

export const THEME_PROJECT_VERSION = 1 as const;
export const MAX_THEME_PROJECT_BYTES = 8 * 1024 * 1024;
export const PROJECT_TOKEN_FAMILIES = ['color', 'space', 'type', 'radius', 'elevation', 'motion', 'state'] as const;
export type ProjectTokenFamily = typeof PROJECT_TOKEN_FAMILIES[number];
export type ProjectFonts = { body: string; display: string; mono: string };
export type ProjectTheme = {
  name: string;
  seed: ThemeSeed;
  overrides?: Partial<ThemeContract['families']>;
  fonts: ProjectFonts;
};
export type ProjectRevision = {
  revision: number;
  theme: ProjectTheme;
  viewports: number[];
  createdAt: string;
  label: string;
};
export type ProjectReview = {
  component: string;
  caseKey: string;
  projectIdentity: string;
  artifactFingerprint: string;
  verdict: 'up' | 'down' | null;
  note: string;
  updatedAt: string;
};
export type ThemeProject = {
  schemaVersion: 1;
  id: string;
  revision: number;
  theme: ProjectTheme;
  viewports: number[];
  history: ProjectRevision[];
  reviews: ProjectReview[];
  qualification?: ProjectQualificationReceipt;
  qualificationHistory?: ProjectQualificationReceipt[];
};
export type ProjectTokenChange = {
  family: ProjectTokenFamily;
  token: string;
  before: ThemeTokenValue | null;
  after: ThemeTokenValue | null;
};
export type ThemeProjectPatch = {
  schemaVersion: 1;
  id: string;
  title: string;
  projectIdentity: string;
  changes: ProjectTokenChange[];
};
export type ThemeProjectValidation =
  | { valid: true; project: ThemeProject; errors: Record<string, never> }
  | { valid: false; errors: Record<string, string> };

const HASH = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function timestamp(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
}
function widths(value: unknown): value is number[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 6 &&
    value.every((width) => Number.isInteger(width) && width >= 320 && width <= 2000) &&
    new Set(value).size === value.length;
}
function safeValue(value: unknown): value is ThemeTokenValue {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  if (typeof value === 'number' && !Number.isFinite(value)) return false;
  if (typeof value === 'string' && (value.length === 0 || value.length > 512)) return false;
  try { assertSafeCssValue(value); return true; } catch { return false; }
}
export function validateProjectTheme(value: unknown): { valid: true; theme: ProjectTheme } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!record(value)) return { valid: false, errors: { theme: 'Use a theme object.' } };
  if (typeof value.name !== 'string' || value.name.trim().length < 1 || value.name.length > 64 || [...value.name].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) errors.name = 'Use a name from 1 to 64 characters.';
  if (typeof value.name === 'string' && /^dk-[a-z0-9-]+-default$/i.test(value.name)) errors.name = 'Choose a name that does not use the reserved default recipe prefix.';
  const seed = value.seed;
  if (!record(seed)) errors.seed = 'Provide the theme seed.';
  else {
    if (typeof seed.color !== 'string' || !/^#[a-fA-F0-9]{6}$/.test(seed.color)) errors.color = 'Use a six-digit hexadecimal color.';
    if (seed.mode !== 'light' && seed.mode !== 'dark') errors.mode = 'Choose light or dark mode.';
    if (seed.density !== 'comfortable' && seed.density !== 'compact') errors.density = 'Choose comfortable or compact density.';
    try {
      if ((typeof seed.ratio !== 'string' && typeof seed.ratio !== 'number') || (typeof seed.ratio === 'number' && !Number.isFinite(seed.ratio))) throw new Error('ratio');
      const ratio = resolveRatio(String(seed.ratio));
      if (!Number.isFinite(ratio.value) || ratio.value <= 1 || ratio.value > 3) throw new Error('ratio');
    } catch { errors.ratio = 'Use a supported ratio greater than 1 and no greater than 3.'; }
    if (typeof seed.motion !== 'string' || !['snappy', 'calm', 'expressive', 'reduced'].includes(seed.motion)) errors.motion = 'Choose snappy, calm, expressive, or reduced motion.';
    if (seed.contrastProfile !== undefined && seed.contrastProfile !== 'default' && seed.contrastProfile !== 'low-vision') errors.contrastProfile = 'Choose a supported contrast profile.';
  }
  if (!record(value.fonts)) errors.fonts = 'Provide body, display, and mono font stacks.';
  else for (const key of ['body', 'display', 'mono']) {
    const font = value.fonts[key];
    if (typeof font !== 'string' || font.trim().length === 0 || font.length > 200 || !safeValue(font) || /[()\\]/.test(font)) errors[`fonts.${key}`] = 'Use a CSS font stack with at most 200 characters.';
  }
  if (value.overrides !== undefined) {
    if (!record(value.overrides)) errors.overrides = 'Use token family objects.';
    else for (const [family, tokens] of Object.entries(value.overrides)) {
      if (!PROJECT_TOKEN_FAMILIES.includes(family as ProjectTokenFamily) || !record(tokens)) { errors[`overrides.${family}`] = 'Use a supported token family.'; continue; }
      if (Object.keys(tokens).length > 200) errors[`overrides.${family}`] = 'Use at most 200 overrides in each family.';
      for (const [token, tokenValue] of Object.entries(tokens)) {
        try { assertSafeCssCustomPropertyBody(token); } catch { errors[`overrides.${family}.${token}`] = 'Use a CSS token name.'; }
        if (!safeValue(tokenValue)) errors[`overrides.${family}.${token}`] = 'Use a finite number or safe CSS value.';
      }
    }
  }
  return Object.keys(errors).length ? { valid: false, errors } : { valid: true, theme: structuredClone(value) as ProjectTheme };
}

/** Validates portable inputs without discarding historical evidence. */
export function validateThemeProject(value: unknown): ThemeProjectValidation {
  const errors: Record<string, string> = {};
  if (!record(value)) return { valid: false, errors: { project: 'Use a project object.' } };
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_THEME_PROJECT_BYTES) errors.project = 'Keep the project within 8 MiB. Export earlier evidence before creating another project.';
  } catch { return { valid: false, errors: { project: 'Use serializable project inputs and evidence.' } }; }
  if (value.schemaVersion !== 1) errors.schemaVersion = 'Use project schema version 1.';
  if (typeof value.id !== 'string' || !SAFE_ID.test(value.id)) errors.id = 'Use a project ID with at most 128 safe characters.';
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 1) errors.revision = 'Use a positive revision number.';
  const theme = validateProjectTheme(value.theme);
  if (!theme.valid) Object.assign(errors, theme.errors);
  if (!widths(value.viewports)) errors.viewports = 'Record 1 to 6 distinct integer widths from 320 to 2000 pixels.';
  if (!Array.isArray(value.history) || value.history.length > 1000) errors.history = 'Provide at most 1000 saved revisions.';
  else {
    const seen = new Set<number>();
    for (const [index, entry] of value.history.entries()) {
      if (!record(entry) || !Number.isSafeInteger(entry.revision) || Number(entry.revision) < 1 || Number(entry.revision) >= Number(value.revision) || seen.has(Number(entry.revision)) || !timestamp(entry.createdAt) || typeof entry.label !== 'string' || entry.label.length > 200 || !widths(entry.viewports) || !validateProjectTheme(entry.theme).valid) errors[`history.${index}`] = 'Use a distinct earlier revision with a valid theme, widths, label, and timestamp.';
      else seen.add(Number(entry.revision));
    }
  }
  if (!Array.isArray(value.reviews) || value.reviews.length > 5000) errors.reviews = 'Provide at most 5000 reviews.';
  else for (const [index, entry] of value.reviews.entries()) {
    if (!record(entry) || typeof entry.component !== 'string' || !SAFE_ID.test(entry.component) || typeof entry.caseKey !== 'string' || entry.caseKey.length > 256 || !entry.caseKey || typeof entry.projectIdentity !== 'string' || !HASH.test(entry.projectIdentity) || typeof entry.artifactFingerprint !== 'string' || !HASH.test(entry.artifactFingerprint) || !['up', 'down', null].includes(entry.verdict as 'up' | 'down' | null) || typeof entry.note !== 'string' || entry.note.length > 10000 || !timestamp(entry.updatedAt)) errors[`reviews.${index}`] = 'Use a review bound to a project and component artifact.';
  }
  if (value.qualification !== undefined) {
    const qualification = validateProjectQualificationReceipt(value.qualification);
    if (!qualification.valid) errors.qualification = qualification.errors.join(' ');
  }
  if (value.qualificationHistory !== undefined) {
    if (!Array.isArray(value.qualificationHistory) || value.qualificationHistory.length > 50) errors.qualificationHistory = 'Provide at most 50 earlier qualification receipts.';
    else for (const [index, receipt] of value.qualificationHistory.entries()) {
      const checked = validateProjectQualificationReceipt(receipt);
      if (!checked.valid) errors[`qualificationHistory.${index}`] = checked.errors.join(' ');
    }
  }
  if (Object.keys(errors).length) return { valid: false, errors };
  return { valid: true, project: structuredClone(value) as ThemeProject, errors: {} };
}

export function createThemeProject(input: { id?: string; theme: ProjectTheme; viewports?: number[] }, _now = new Date().toISOString()): ThemeProject {
  const result = validateThemeProject({ schemaVersion: 1, id: input.id ?? crypto.randomUUID(), revision: 1, theme: input.theme, viewports: input.viewports ?? [320, 768, 1280], history: [], reviews: [] });
  if (!result.valid) throw new Error(Object.values(result.errors).join(' '));
  return result.project;
}
export function reviseThemeProject(project: ThemeProject, change: { theme?: ProjectTheme; viewports?: number[] }, label = 'Edit theme', now = new Date().toISOString()): ThemeProject {
  const next = {
    ...project, revision: project.revision + 1,
    theme: change.theme ?? project.theme, viewports: change.viewports ?? project.viewports,
    history: [...project.history, { revision: project.revision, theme: project.theme, viewports: project.viewports, createdAt: now, label }]
  };
  const result = validateThemeProject(next);
  if (!result.valid) throw new Error(Object.values(result.errors).join(' '));
  return result.project;
}
export function restoreThemeProjectRevision(project: ThemeProject, revision: number, now = new Date().toISOString()): ThemeProject {
  const snapshot = project.history.find((entry) => entry.revision === revision);
  if (!snapshot) throw new Error(`Revision ${revision} is unavailable.`);
  return reviseThemeProject(project, snapshot, `Restore revision ${revision}`, now);
}
/** Produces deterministic JSON independently of object insertion order. */
export function canonicalProjectJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const result = JSON.stringify(value);
    if (result === undefined) throw new Error('Canonical JSON requires serializable values.');
    return result;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalProjectJson).join(',')}]`;
  return `{${Object.entries(value).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right, 'en')).map(([key, item]) => `${JSON.stringify(key)}:${canonicalProjectJson(item)}`).join(',')}}`;
}
export async function hashProjectValue(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalProjectJson(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
/** Identifies authored content; revision metadata and evidence do not change it. */
export function projectIdentity(project: Pick<ThemeProject, 'schemaVersion' | 'theme' | 'viewports'>): Promise<string> {
  return hashProjectValue({ schemaVersion: project.schemaVersion, theme: project.theme, viewports: project.viewports });
}
/** Sends current qualification inputs without saved notes, revisions, or receipts. */
export function qualificationProjectInput(project: ThemeProject): ThemeProject {
  const result = validateThemeProject({ schemaVersion: project.schemaVersion, id: project.id,
    revision: project.revision, theme: project.theme, viewports: project.viewports, history: [], reviews: [] });
  if (!result.valid) throw new Error(Object.values(result.errors).join(' '));
  return result.project;
}
export function validateThemeProjectPatch(value: unknown): { valid: true; patch: ThemeProjectPatch } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!record(value)) return { valid: false, errors: ['Use a patch object.'] };
  if (value.schemaVersion !== 1 || typeof value.id !== 'string' || !SAFE_ID.test(value.id) || typeof value.title !== 'string' || !value.title || value.title.length > 200 || typeof value.projectIdentity !== 'string' || !HASH.test(value.projectIdentity)) errors.push('Provide patch version 1, an ID, a title, and the project identity.');
  if (!Array.isArray(value.changes) || value.changes.length < 1 || value.changes.length > 200) errors.push('Provide 1 to 200 token changes.');
  else {
    const seen = new Set<string>();
    for (const change of value.changes) {
      if (!record(change) || !PROJECT_TOKEN_FAMILIES.includes(change.family as ProjectTokenFamily) || typeof change.token !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(change.token) || (change.before !== null && !safeValue(change.before)) || (change.after !== null && !safeValue(change.after))) { errors.push('Use valid token changes with before and after values.'); continue; }
      const key = `${change.family}.${change.token}`;
      if (seen.has(key)) errors.push(`Change ${key} only once.`);
      seen.add(key);
    }
  }
  return errors.length ? { valid: false, errors } : { valid: true, patch: structuredClone(value) as ThemeProjectPatch };
}
export async function applyThemeProjectPatch(project: ThemeProject, value: unknown, now = new Date().toISOString()): Promise<ThemeProject> {
  const result = validateThemeProjectPatch(value);
  if (!result.valid) throw new Error(result.errors.join(' '));
  const patch = result.patch;
  if (await projectIdentity(project) !== patch.projectIdentity) throw new Error('The patch belongs to a different theme revision.');
  const theme = structuredClone(project.theme);
  theme.overrides ??= {};
  for (const change of patch.changes) {
    let family = theme.overrides[change.family] ?? {};
    if ((family[change.token] ?? null) !== change.before) throw new Error(`The override for ${change.family}.${change.token} has changed.`);
    if (change.after === null) family = Object.fromEntries(Object.entries(family).filter(([token]) => token !== change.token));
    else family[change.token] = change.after;
    theme.overrides[change.family] = family;
  }
  return reviseThemeProject(project, { theme }, patch.title, now);
}
