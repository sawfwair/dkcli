import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const packages = [
  { id: 'cli', name: '@dkcli/cli', cwd: root, forbidSpec: true },
  { id: 'core', name: '@dkcli/core', cwd: resolve(root, 'packages/core'), forbidSpec: true },
  { id: 'tokens', name: '@dkcli/tokens', cwd: resolve(root, 'packages/tokens'), forbidSpec: true },
  { id: 'components', name: '@dkcli/components', cwd: resolve(root, 'packages/components'), forbidSpec: false }
];

const requested = new Set(process.argv.slice(2));
const selected =
  requested.size === 0
    ? packages
    : packages.filter((pkg) => requested.has(pkg.id) || requested.has(pkg.name));

if (selected.length === 0) {
  console.error(`No package matched: ${[...requested].join(', ')}`);
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function parsePackJson(stdout) {
  const start = stdout.indexOf('[');
  const end = stdout.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('npm pack did not return JSON output');
  }

  return JSON.parse(stdout.slice(start, end + 1));
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function forbiddenPathReason(file, pkg) {
  const lower = file.toLowerCase();

  if (lower.endsWith('.map')) return 'source map';
  if (file === '.env' || file.startsWith('.env.') || file.includes('/.env')) return 'env file';
  if (file === 'src' || file.startsWith('src/')) return 'raw source tree';
  if (file === '.git' || file.startsWith('.git/') || file.includes('/.git/')) return 'git metadata';
  if (file === 'node_modules' || file.startsWith('node_modules/')) return 'vendored node_modules';
  if (file === 'coverage' || file.startsWith('coverage/') || file.includes('/coverage/')) return 'coverage output';
  if (file === '__tests__' || file.includes('/__tests__/')) return 'test directory';
  if (/(?:^|\/)[^/]+\.test\.(?:js|mjs|cjs|ts|tsx|svelte|d\.ts)$/.test(file)) return 'test artifact';
  if (pkg.forbidSpec && /(?:^|\/)[^/]+\.spec\.(?:js|mjs|cjs|ts|tsx|svelte|d\.ts)$/.test(file)) {
    return 'spec artifact';
  }
  if (pkg.id === 'components' && /(?:^|\/)[^/]+Harness\.svelte(?:\.d\.ts)?$/.test(file)) {
    return 'test harness';
  }
  if (pkg.id === 'components' && (file === 'dist/test-utils' || file.startsWith('dist/test-utils/'))) {
    return 'test utility';
  }

  return '';
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function forbiddenContentReason(pkg, file) {
  const path = resolve(pkg.cwd, file);
  let content = '';

  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return '';
  }

  if (/sourceMappingURL|sourcesContent/.test(content)) return 'source map reference/content';
  if (/src\/lib\/server\//.test(content)) return 'private server module reference';
  if (/src\/routes\//.test(content)) return 'private website route reference';
  if (/workers\/dkcms\//.test(content)) return 'private dkcms worker reference';
  if (/wrangler\.(?:production\.)?generated\.jsonc/.test(content)) return 'private deploy config reference';
  if (/\b(?:AUTH_INTERNAL_TOKEN|INTERNAL_SERVICE_TOKEN|DKCMS_INTERNAL_TOKEN)\b/.test(content)) {
    return 'private runtime token reference';
  }
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) return 'private key';
  if (/npm_[A-Za-z0-9]{20,}/.test(content)) return 'hardcoded npm token';
  if (/ghp_[A-Za-z0-9]{20,}/.test(content)) return 'hardcoded GitHub token';
  if (/github_pat_[A-Za-z0-9_]{30,}/.test(content)) return 'hardcoded GitHub token';
  if (/sk-[A-Za-z0-9_-]{20,}/.test(content)) return 'hardcoded API token';
  if (/AKIA[0-9A-Z]{16}/.test(content)) return 'hardcoded AWS key id';

  return '';
}

let hasFailures = false;

for (const pkg of selected) {
  const env = { ...process.env };
  delete env.npm_config_link_workspace_packages;
  env.npm_config_cache = resolve(root, '.npm-cache');

  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: pkg.cwd,
    env,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    hasFailures = true;
    console.error(`Package content check failed while packing ${pkg.name}`);
    if (result.error) console.error(result.error.message);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
    continue;
  }

  let packed;
  try {
    packed = parsePackJson(result.stdout);
  } catch (error) {
    hasFailures = true;
    console.error(`Package content check could not parse npm pack output for ${pkg.name}: ${error.message}`);
    continue;
  }

  const files = packed.flatMap((entry) => entry.files.map((file) => file.path));
  const violations = [];

  for (const file of files) {
    const pathReason = forbiddenPathReason(file, pkg);
    if (pathReason) {
      violations.push(`${file} (${pathReason})`);
      continue;
    }

    const contentReason = forbiddenContentReason(pkg, file);
    if (contentReason) violations.push(`${file} (${contentReason})`);
  }

  if (violations.length > 0) {
    hasFailures = true;
    console.error(`Package content check failed for ${pkg.name}:`);
    for (const violation of violations) console.error(`  - ${violation}`);
  } else {
    console.log(`${pkg.name}: package contents clean (${files.length} files)`);
  }
}

if (hasFailures) process.exit(1);
