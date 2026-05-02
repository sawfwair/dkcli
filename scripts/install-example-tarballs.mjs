import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const tarballDir = join(repoRoot, '.release-tarballs');
const tempExampleDir = resolve(process.env.TMPDIR ?? '/tmp', 'designkit-svelte-starter-pack');
const sourceExampleDir = join(repoRoot, 'examples', 'svelte-starter');
const corePackageJson = JSON.parse(readFileSync(join(repoRoot, 'packages', 'core', 'package.json'), 'utf8'));
const tokensPackageJson = JSON.parse(readFileSync(join(repoRoot, 'packages', 'tokens', 'package.json'), 'utf8'));
const componentsPackageJson = JSON.parse(readFileSync(join(repoRoot, 'packages', 'components', 'package.json'), 'utf8'));

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {void}
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env }
  });
}

rmSync(tarballDir, { recursive: true, force: true });
rmSync(tempExampleDir, { recursive: true, force: true });
mkdirSync(tarballDir, { recursive: true });
mkdirSync(join(repoRoot, '.tmp'), { recursive: true });

run('pnpm', ['build:packages'], repoRoot);
run('pnpm', ['pack', '--pack-destination', tarballDir], join(repoRoot, 'packages', 'core'));
run('pnpm', ['pack', '--pack-destination', tarballDir], join(repoRoot, 'packages', 'tokens'));
run('pnpm', ['pack', '--pack-destination', tarballDir], join(repoRoot, 'packages', 'components'));

cpSync(sourceExampleDir, tempExampleDir, { recursive: true });

const tempPackageJsonPath = join(tempExampleDir, 'package.json');
const tempPackageJson = JSON.parse(readFileSync(tempPackageJsonPath, 'utf8'));
delete tempPackageJson.dependencies['@dkcli/components'];
delete tempPackageJson.dependencies['@dkcli/core'];
delete tempPackageJson.dependencies['@dkcli/tokens'];
writeFileSync(tempPackageJsonPath, `${JSON.stringify(tempPackageJson, null, 2)}\n`);

const tarballs = readdirSync(tarballDir)
  .filter((file) => file.endsWith('.tgz'))
  .map((file) => join(tarballDir, file));

const tarballByName = Object.fromEntries(
  tarballs.map((tarballPath) => [tarballPath.split('/').pop(), tarballPath])
);

/**
 * @param {{ name: string; version: string }} packageJson
 * @returns {string}
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function tarballNameFor(packageJson) {
  return `${packageJson.name.replace(/^@/, '').replace('/', '-')}-${packageJson.version}.tgz`;
}

const coreTarballName = tarballNameFor(corePackageJson);
const tokensTarballName = tarballNameFor(tokensPackageJson);
const componentsTarballName = tarballNameFor(componentsPackageJson);

if (!tarballByName[coreTarballName] || !tarballByName[tokensTarballName] || !tarballByName[componentsTarballName]) {
  throw new Error(`Missing expected tarballs in ${tarballDir}`);
}

tempPackageJson.dependencies['@dkcli/core'] = tarballByName[coreTarballName];
tempPackageJson.dependencies['@dkcli/tokens'] = tarballByName[tokensTarballName];
tempPackageJson.dependencies['@dkcli/components'] = tarballByName[componentsTarballName];
tempPackageJson.pnpm = {
  ...(tempPackageJson.pnpm ?? {}),
  overrides: {
    ...(tempPackageJson.pnpm?.overrides ?? {}),
    '@dkcli/core': tarballByName[coreTarballName],
    '@dkcli/tokens': tarballByName[tokensTarballName],
    '@dkcli/components': tarballByName[componentsTarballName]
  }
};
writeFileSync(tempPackageJsonPath, `${JSON.stringify(tempPackageJson, null, 2)}\n`);

run('pnpm', ['install', '--ignore-workspace'], tempExampleDir);
run('pnpm', ['run', 'build'], tempExampleDir);

if (!existsSync(join(tempExampleDir, 'dist', 'index.html'))) {
  throw new Error('Example starter build did not produce dist/index.html');
}
