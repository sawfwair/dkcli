import type { ThemeSeed } from './component-spec.ts';
import type { ThemeContract, ThemeTokenValue } from './theme-contract.ts';
import { type ProjectQualificationReceipt } from './qualification.ts';
export declare const THEME_PROJECT_VERSION: 1;
export declare const MAX_THEME_PROJECT_BYTES: number;
export declare const PROJECT_TOKEN_FAMILIES: readonly ["color", "space", "type", "radius", "elevation", "motion", "state"];
export type ProjectTokenFamily = typeof PROJECT_TOKEN_FAMILIES[number];
export type ProjectFonts = {
    body: string;
    display: string;
    mono: string;
};
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
export type ThemeProjectValidation = {
    valid: true;
    project: ThemeProject;
    errors: Record<string, never>;
} | {
    valid: false;
    errors: Record<string, string>;
};
export declare function validateProjectTheme(value: unknown): {
    valid: true;
    theme: ProjectTheme;
} | {
    valid: false;
    errors: Record<string, string>;
};
/** Validates portable inputs without discarding historical evidence. */
export declare function validateThemeProject(value: unknown): ThemeProjectValidation;
export declare function createThemeProject(input: {
    id?: string;
    theme: ProjectTheme;
    viewports?: number[];
}, _now?: string): ThemeProject;
export declare function reviseThemeProject(project: ThemeProject, change: {
    theme?: ProjectTheme;
    viewports?: number[];
}, label?: string, now?: string): ThemeProject;
export declare function restoreThemeProjectRevision(project: ThemeProject, revision: number, now?: string): ThemeProject;
/** Produces deterministic JSON independently of object insertion order. */
export declare function canonicalProjectJson(value: unknown): string;
export declare function hashProjectValue(value: unknown): Promise<string>;
/** Identifies authored content; revision metadata and evidence do not change it. */
export declare function projectIdentity(project: Pick<ThemeProject, 'schemaVersion' | 'theme' | 'viewports'>): Promise<string>;
/** Sends current qualification inputs without saved notes, revisions, or receipts. */
export declare function qualificationProjectInput(project: ThemeProject): ThemeProject;
export declare function validateThemeProjectPatch(value: unknown): {
    valid: true;
    patch: ThemeProjectPatch;
} | {
    valid: false;
    errors: string[];
};
export declare function applyThemeProjectPatch(project: ThemeProject, value: unknown, now?: string): Promise<ThemeProject>;
