import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RATIOS } from '@dkcli/core';
import { DEFAULT_THEME, INITIAL_RELEASES, fitsReleaseCookie, parseTheme, readReleases, readTheme, validateRelease } from './model.js';

test('workbench JSON regenerates a valid theme seed and discards supplied tokens', () => {
  assert.deepEqual(parseTheme({ ...DEFAULT_THEME, families: { color: { primary: '</style><script>' } } }), DEFAULT_THEME);
  assert.equal(parseTheme({ ...DEFAULT_THEME, seed: { ...DEFAULT_THEME.seed, ratio: 'perfect-fourth' } })?.seed.ratio, 4 / 3);
  for (const [name, ratio] of Object.entries(RATIOS)) assert.equal(parseTheme({ ...DEFAULT_THEME, seed: { ...DEFAULT_THEME.seed, ratio: name } })?.seed.ratio, ratio);
  for (const value of [null, {}, { ...DEFAULT_THEME, name: '</style>' }, { ...DEFAULT_THEME, seed: { ...DEFAULT_THEME.seed, ratio: 0 } }, { ...DEFAULT_THEME, seed: { ...DEFAULT_THEME.seed, color: 'red;}' } }]) assert.equal(parseTheme(value), null);
  assert.deepEqual(readTheme('invalid'), DEFAULT_THEME);
});

test('untrusted demo cookies are bounded, reject malformed rows, and preserve empty workspaces', () => {
  assert.deepEqual(readReleases('[]'), []);
  assert.deepEqual(readReleases(JSON.stringify([INITIAL_RELEASES[0], INITIAL_RELEASES[0]])), INITIAL_RELEASES);
  assert.deepEqual(readReleases(JSON.stringify(Array.from({ length: 9 }, () => INITIAL_RELEASES[0]))), INITIAL_RELEASES);
  assert.deepEqual(readReleases(JSON.stringify([{ ...INITIAL_RELEASES[0], status: 'Hacked' }])), INITIAL_RELEASES);
  assert.deepEqual(readReleases('invalid'), INITIAL_RELEASES);
  assert.equal(fitsReleaseCookie(INITIAL_RELEASES), true);
  assert.equal(fitsReleaseCookie(Array.from({ length: 8 }, (_, index) => ({ ...INITIAL_RELEASES[0], id: `RL-${index}`, title: '界'.repeat(64), owner: '名'.repeat(40) }))), false);
});

test('server validation rejects missing and long names and unknown environments', () => {
  const data = new FormData();
  assert.deepEqual(Object.keys(validateRelease(data).errors), ['title', 'owner', 'environment']);
  data.set('title', '  A real release  '); data.set('owner', 'Casey'); data.set('environment', 'Production');
  assert.deepEqual(validateRelease(data), { fields: { title: 'A real release', owner: 'Casey', environment: 'Production' }, errors: {} });
  data.set('title', 'a'.repeat(65)); data.set('environment', 'Anything');
  assert.deepEqual(Object.keys(validateRelease(data).errors), ['title', 'environment']);
});
