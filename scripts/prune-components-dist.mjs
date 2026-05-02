import { readdir, rm } from 'node:fs/promises';
import { resolve, relative, join, sep } from 'node:path';

const distDir = resolve(process.argv[2] ?? 'packages/components/dist');
const removed = [];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function toPosix(path) {
  return path.split(sep).join('/');
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function shouldPruneFile(relativePath) {
  return (
    /(?:^|\/)[^/]+\.test\.(?:js|mjs|cjs|d\.ts)$/.test(relativePath) ||
    /(?:^|\/)[^/]+Harness\.svelte(?:\.d\.ts)?$/.test(relativePath)
  );
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);
    const rel = toPosix(relative(distDir, path));

    if (entry.isDirectory()) {
      if (rel === 'test-utils' || rel.endsWith('/test-utils')) {
        await rm(path, { recursive: true, force: true });
        removed.push(`${rel}/`);
        continue;
      }

      await walk(path);
      continue;
    }

    if (shouldPruneFile(rel)) {
      await rm(path, { force: true });
      removed.push(rel);
    }
  }
}

await walk(distDir);

if (removed.length > 0) {
  console.log(`Pruned ${removed.length} package-only test artifact(s) from ${distDir}`);
}
