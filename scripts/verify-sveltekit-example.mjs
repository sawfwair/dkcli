import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const consumer = mkdtempSync(join(tmpdir(), 'designkit-sveltekit-'));
const tarballs = mkdtempSync(join(tmpdir(), 'designkit-sveltekit-tarballs-'));

/** @param {string[]} args @param {string} cwd @returns {void} */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function run(args, cwd) { execFileSync('pnpm', args, { cwd, stdio: 'inherit', env: process.env }); }

run(['build:packages'], root);
cpSync(join(root, 'examples/sveltekit-starter'), consumer, { recursive: true, filter: (path) => !/(?:^|\/)(?:node_modules|build|\.svelte-kit|test-results|playwright-report)(?:\/|$)/.test(path) });
const manifestPath = join(consumer, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const overrides = {};
for (const folder of ['core', 'tokens', 'components']) {
  const source = join(root, 'packages', folder);
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  run(['pack', '--pack-destination', tarballs], source);
  const path = join(tarballs, `${pkg.name.replace(/^@/, '').replace('/', '-')}-${pkg.version}.tgz`);
  manifest.dependencies[pkg.name] = path;
  overrides[pkg.name] = path;
}
manifest.pnpm = { onlyBuiltDependencies: ['esbuild'], overrides };
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Isolated SvelteKit consumer: ${consumer}`);
run(['install', '--ignore-workspace'], consumer);
run(['check'], consumer);
run(['test'], consumer);
run(['build'], consumer);
run(['check:server'], consumer);
run(['test:browser'], consumer);
console.log(`SvelteKit public-package consumer verified: ${consumer}`);
