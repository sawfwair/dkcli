import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createServer } from 'vite';

// Run SSR in Node so Vite/esbuild does not inherit jsdom's mixed typed-array realm.
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('../../../../..', import.meta.url)),
  plugins: [svelte({ compilerOptions: { hmr: false } })],
  resolve: {
    alias: {
      '@dkcli/core': fileURLToPath(new URL('../../../../core/src/index.ts', import.meta.url)),
      '@dkcli/tokens': fileURLToPath(new URL('../../../../tokens/src/index.ts', import.meta.url))
    }
  },
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent'
});

try {
  const { default: Harness } = await server.ssrLoadModule(fileURLToPath(new URL('./ComponentIdentityHarness.svelte', import.meta.url)));
  const { render } = await server.ssrLoadModule('svelte/server');
  const results = {};
  for (const kind of JSON.parse(process.argv[2])) {
    results[kind] = {
      first: render(Harness, { props: { kind } }).body,
      second: render(Harness, { props: { kind } }).body
    };
  }
  process.stdout.write(JSON.stringify(results));
} finally {
  await server.close();
}
