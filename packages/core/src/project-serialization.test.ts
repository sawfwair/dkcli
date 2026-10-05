import { describe, expect, it } from 'vitest';
import { applyThemeProjectPatch, canonicalProjectJson, createThemeProject, hashProjectValue, projectIdentity, validateProjectTheme, validateThemeProject, validateThemeProjectPatch, type ProjectTheme } from './project.ts';

const theme: ProjectTheme = {
  name: 'Portable', seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' },
  fonts: { body: 'sans-serif', display: 'serif', mono: 'monospace' }
};

describe('portable project serialization', () => {
  it('applies a patch to the validated snapshot whose identity was checked before the digest await', async () => {
    const project = createThemeProject({ theme });
    const identity = await projectIdentity(project);
    const pending = applyThemeProjectPatch(project, { schemaVersion: 1, id: 'radius', title: 'Radius', projectIdentity: identity, changes: [{ family: 'radius', token: 'md', before: null, after: '8px' }] });
    project.theme.seed.color = '#c44724';
    project.viewports[0] = 360;
    const updated = await pending;
    expect(updated.theme.seed.color).toBe('#295dff');
    expect(updated.viewports[0]).toBe(320);
    expect(updated.history[0].theme.seed.color).toBe('#295dff');
    expect(updated.theme.overrides?.radius?.md).toBe('8px');
    expect(project.theme.overrides).toBeUndefined();
  });

  it('returns an invalid patch verdict for uncloneable metadata', () => {
    const patch = { schemaVersion: 1, id: 'radius', title: 'Radius', projectIdentity: 'a'.repeat(64), changes: [{ family: 'radius', token: 'md', before: null, after: '8px' }], callback: (): void => undefined };
    expect(() => validateThemeProjectPatch(patch)).not.toThrow();
    expect(validateThemeProjectPatch(patch).valid).toBe(false);
  });
  it('canonicalizes sparse arrays according to their actual exported JSON representation', async () => {
    const value = { extra: Array<unknown>(2) };
    const roundTrip: unknown = JSON.parse(JSON.stringify(value));
    expect(canonicalProjectJson(value)).toBe('{"extra":[null,null]}');
    expect(await hashProjectValue(value)).toBe(await hashProjectValue(roundTrip));
  });

  it('keeps serializable nested metadata identity stable after a JSON export/import', async () => {
    const project = createThemeProject({ theme: { ...theme, metadata: { savedAt: new Date('2026-10-04T12:00:00Z') } } as ProjectTheme });
    const imported = validateThemeProject(JSON.parse(JSON.stringify(project)));
    expect(imported.valid).toBe(true);
    if (!imported.valid) throw new Error('Expected a serializable project.');
    expect(await projectIdentity(project)).toBe(await projectIdentity(imported.project));
  });

  it('rejects a sparse viewport array rather than certifying nonexistent widths', () => {
    const project = createThemeProject({ theme });
    expect(validateThemeProject({ ...project, viewports: Array<number>(1) }).valid).toBe(false);
  });

  it('reports uncloneable nested input as invalid instead of throwing from a validation API', () => {
    const value = { ...theme, metadata: { callback: (): string => 'not portable' } };
    expect(() => validateProjectTheme(value)).not.toThrow();
    expect(validateProjectTheme(value).valid).toBe(false);
    const project = createThemeProject({ theme });
    expect(() => validateThemeProject({ ...project, metadata: value.metadata })).not.toThrow();
    expect(validateThemeProject({ ...project, metadata: value.metadata }).valid).toBe(false);
  });

  it('hashes a snapshot before asynchronous digest work and keeps validation copies independent', async () => {
    const project = createThemeProject({ theme });
    const before = structuredClone(project);
    const pending = projectIdentity(project);
    project.theme.fonts.body = 'serif';
    project.viewports[0] = 360;
    expect(await pending).toBe(await projectIdentity(before));
    expect(await projectIdentity(project)).not.toBe(await pending);
    expect(theme.fonts.body).toBe('sans-serif');
  });
});
