import { type ThemeProject, type ProjectFonts } from './project.ts';
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
    colorScheme: 'light' | 'dark';
    zoom: 1 | 2;
    zoomMode: 'css' | 'none';
    dpr: number;
    fontFixture?: 'release-sans-v1';
};
export type QualificationDeclaredCase = {
    component: string;
    caseId: string;
    axes: Record<string, string>;
    state: Record<string, string | boolean>;
    requiredChecks: string[];
};
export type QualificationBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type QualificationCheck = {
    kind: string;
    status: QualificationCheckStatus;
    message: string;
    selector?: string;
};
export type QualificationGeometry = {
    selector: string;
    bounds: QualificationBounds;
    clientWidth: number;
    scrollWidth: number;
    textOverflow: boolean;
    containerOverflow: boolean;
    fontFamily: string;
    fontSize: string;
};
export type QualificationMeasurement = {
    component: string;
    caseId: string;
    axes: Record<string, string>;
    state: Record<string, string | boolean>;
    viewport: {
        width: number;
        height: number;
    };
    checks: QualificationCheck[];
    geometry: QualificationGeometry[];
    screenshot?: {
        mediaType: 'image/jpeg';
        data: string;
        width: number;
        height: number;
    };
};
/** Unsigned producer evidence, scoped to the listed scenes, widths, checks, and artifacts. */
export type ProjectQualificationReceipt = {
    schemaVersion: 1;
    createdAt: string;
    projectIdentity: string;
    artifactFingerprint: string;
    status: QualificationStatus;
    browser: {
        provider: 'local-chromium' | 'local-firefox' | 'local-webkit' | 'cloudflare-browser';
        version: string;
        userAgent: string;
    };
    environment?: QualificationEnvironment;
    viewports: number[];
    fonts: {
        requested: ProjectFonts;
        ready: boolean;
        loaded: {
            family: string;
            status: string;
        }[];
    };
    mathematics: {
        fixtureCount: number;
        failedCount: number;
        unsupportedCount: number;
        components: {
            component: string;
            fixtureCount: number;
            failedCaseIds: string[];
            unsupportedCaseIds: string[];
        }[];
    };
    measurements: QualificationMeasurement[];
    coverage: {
        componentCount: number;
        caseCount: number;
        widthCount: number;
        untested: string[];
        unsupported: string[];
        declaredCases?: QualificationDeclaredCase[];
    };
};
export declare const MAX_QUALIFICATION_BYTES: number;
export declare const MAX_QUALIFICATION_SCREENSHOT_BYTES: number;
/** Validates bounded, explicit runtime selections without silently substituting a browser or case. */
export declare function validateQualificationOptions(value: unknown): {
    valid: true;
    options: QualificationOptions;
} | {
    valid: false;
    errors: string[];
};
/** Validates bounded evidence and prevents a passing status from hiding recorded failures or gaps. */
export declare function validateProjectQualificationReceipt(value: unknown): {
    valid: true;
    receipt: ProjectQualificationReceipt;
} | {
    valid: false;
    errors: string[];
};
/** Checks freshness; identities bind evidence to content and artifacts, not to a trusted producer. */
export declare function assertProjectQualificationMatches(project: Pick<ThemeProject, 'schemaVersion' | 'theme' | 'viewports'>, value: unknown, artifactFingerprint?: string): Promise<ProjectQualificationReceipt>;
/** Rejects evidence that silently substitutes explicitly requested runtime selections. */
export declare function assertQualificationOptionsMatch(receipt: ProjectQualificationReceipt, options: QualificationOptions): void;
/** Matches the workbench fingerprint: SHA-256 of sorted package-name/digest pairs. */
export declare function qualificationArtifactFingerprint(packages: Record<string, {
    sha256: string;
}>): Promise<string>;
