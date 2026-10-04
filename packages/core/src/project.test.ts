import { describe, expect, it } from 'vitest';
import { applyThemeProjectPatch, canonicalProjectJson, createThemeProject, projectIdentity, qualificationProjectInput, restoreThemeProjectRevision, reviseThemeProject, validateThemeProject, validateThemeProjectPatch, type ProjectTheme } from './project.ts';

const theme: ProjectTheme = { name: 'Northstar', seed: { color: '#c44724', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' }, fonts: { body: 'system-ui, sans-serif', display: 'Georgia, serif', mono: 'monospace' } };
const now = '2026-10-04T12:00:00.000Z';

describe('portable theme projects', () => {
  it.each(['dk-button-default', 'DK-range-date-picker-default'])('rejects reserved recipe theme name %s on project import', (name) => {
    const project = createThemeProject({ id: 'northstar', theme });
    expect(validateThemeProject({ ...project, theme: { ...theme, name } }).valid).toBe(false);
  });
  it('validates an exported project and keeps input objects independent', () => {
    const project = createThemeProject({ id: 'northstar', theme });
    const checked = validateThemeProject(JSON.parse(JSON.stringify(project)));
    expect(checked.valid).toBe(true);
    project.theme.name = 'Changed';
    expect(theme.name).toBe('Northstar');
  });
  it('binds identity to configuration and widths, independently of metadata ordering', async () => {
    const project = createThemeProject({ theme });
    const first = await projectIdentity(project);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(await projectIdentity({ ...project, viewports: [360] })).not.toBe(first);
    expect(await projectIdentity({ ...project, theme: { ...theme, fonts: { ...theme.fonts, body: 'serif' } } })).not.toBe(first);
    const metadataOnly = { ...project, revision: 15 };
    expect(await projectIdentity(metadataOnly)).toBe(first);
    expect(canonicalProjectJson({ z: 1, a: { y: 2, b: 3 } })).toBe(canonicalProjectJson({ a: { b: 3, y: 2 }, z: 1 }));
  });
  it('retains old snapshots and evidence when restoring a monotonic revision', () => {
    const project = createThemeProject({ theme });
    const updated = reviseThemeProject(project, { theme: { ...theme, name: 'New' } }, 'Rename', now);
    const restored = restoreThemeProjectRevision(updated, 1, now);
    expect(restored.revision).toBe(3);
    expect(restored.theme.name).toBe('Northstar');
    expect(restored.history.map((snapshot) => snapshot.theme.name)).toEqual(['Northstar', 'New']);
    expect(project.history).toHaveLength(0);
  });
  it('retains earlier qualification receipts through edits and portable round trips', () => {
    const receipt = { schemaVersion: 1 as const, createdAt: now, projectIdentity: 'a'.repeat(64), artifactFingerprint: 'b'.repeat(64), status: 'incomplete' as const,
      browser: { provider: 'local-chromium' as const, version: 'test', userAgent: 'test' }, viewports: [320],
      fonts: { requested: theme.fonts, ready: true, loaded: [] },
      mathematics: { fixtureCount: 0, failedCount: 0, unsupportedCount: 0, components: [] },
      measurements: [], coverage: { componentCount: 0, caseCount: 0, widthCount: 0, untested: ['Not captured'], unsupported: [] } };
    const project = { ...createThemeProject({ theme }), qualification: receipt, qualificationHistory: [receipt] };
    const edited = reviseThemeProject(project, { theme: { ...theme, name: 'Edited' } }, 'Rename', now);
    const checked = validateThemeProject(JSON.parse(JSON.stringify(edited)));
    expect(checked.valid).toBe(true);
    if (!checked.valid) throw new Error('Expected a valid portable project.');
    expect(checked.project.qualificationHistory).toEqual([receipt]);
    expect(checked.project.qualification).toEqual(receipt);
  });
  it.each([
    ['version', { schemaVersion: 2 }], ['width', { viewports: [319] }],
    ['duplicate width', { viewports: [320, 320] }], ['history', { history: [{ revision: 4 }] }],
    ['qualification history', { qualificationHistory: [{ status: 'passed' }] }],
    ['review', { reviews: [{ verdict: 'up' }] }], ['qualification', { qualification: { status: 'passed' } }],
    ['unsafe font', { theme: { ...theme, fonts: { ...theme.fonts, body: 'serif; color:red' } } }],
    ['unsafe override', { theme: { ...theme, overrides: { color: { primary: 'red;}body{display:none}' } } } }],
    ['bad ratio', { theme: { ...theme, seed: { ...theme.seed, ratio: 'unknown' } } }]
  ])('rejects malformed %s without changing the current project', (_label, change) => {
    const project = createThemeProject({ theme });
    const original = JSON.stringify(project);
    expect(validateThemeProject({ ...project, ...change }).valid).toBe(false);
    expect(JSON.stringify(project)).toBe(original);
  });
  it('qualifies current inputs without transmitting saved notes or historical evidence', async () => {
    const project = reviseThemeProject(createThemeProject({ theme }), { theme: { ...theme, name: 'Edited' } }, 'Rename', now);
    project.reviews = [{ component: 'button', caseKey: 'playground-default', projectIdentity: 'a'.repeat(64), artifactFingerprint: 'b'.repeat(64), verdict: 'up', note: 'Local review note', updatedAt: now }];
    const input = qualificationProjectInput(project);
    expect(input.revision).toBe(project.revision);
    expect(input.history).toEqual([]);
    expect(input.reviews).toEqual([]);
    expect(await projectIdentity(input)).toBe(await projectIdentity(project));
    expect(project.history).toHaveLength(1);
    expect(project.reviews[0].note).toBe('Local review note');
  });
  it('checks patch identity and override preconditions, then records a reversible revision', async () => {
    const project = createThemeProject({ theme });
    const patch = { schemaVersion: 1, id: 'radius-fix', title: 'Adjust radius', projectIdentity: await projectIdentity(project), changes: [{ family: 'radius', token: 'md', before: null, after: '8px' }] };
    const updated = await applyThemeProjectPatch(project, patch, now);
    expect(updated.theme.overrides?.radius?.md).toBe('8px');
    expect(updated.history[0].theme.overrides).toBeUndefined();
    await expect(applyThemeProjectPatch(updated, patch, now)).rejects.toThrow('different theme');
    await expect(applyThemeProjectPatch(project, { ...patch, changes: [{ ...patch.changes[0], before: '4px' }] }, now)).rejects.toThrow('has changed');
    expect(restoreThemeProjectRevision(updated, 1, now).theme).toEqual(theme);
  });
  it('rejects duplicate changes and CSS injection', () => {
    const change = { family: 'radius', token: 'md', before: null, after: '8px' };
    const patch = { schemaVersion: 1, id: 'fix', title: 'Fix', projectIdentity: 'a'.repeat(64), changes: [change, change] };
    expect(validateThemeProjectPatch(patch).valid).toBe(false);
    expect(validateThemeProjectPatch({ ...patch, changes: [{ ...change, after: '8px;display:none' }] }).valid).toBe(false);
  });
});
