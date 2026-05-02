import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

const coreSrcDir = fileURLToPath(new URL('./packages/core/src', import.meta.url));
const tokensSrcDir = fileURLToPath(new URL('./packages/tokens/src', import.meta.url));
const componentsSrcDir = fileURLToPath(new URL('./packages/components/src', import.meta.url));

export default defineConfig({
  plugins: [svelte({ hot: false }), svelteTesting()],
  resolve: {
    alias: [
      { find: '@dkcli/core', replacement: fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)) },
      { find: /^@dkcli\/core\/(.+)$/, replacement: `${coreSrcDir}/$1` },
      { find: '@dkcli/tokens', replacement: fileURLToPath(new URL('./packages/tokens/src/index.ts', import.meta.url)) },
      { find: /^@dkcli\/tokens\/(.+)$/, replacement: `${tokensSrcDir}/$1` },
      { find: '@dkcli/components', replacement: fileURLToPath(new URL('./packages/components/src/index.ts', import.meta.url)) },
      { find: /^@dkcli\/components\/(.+)$/, replacement: `${componentsSrcDir}/$1` }
    ]
  },
  test: {
    environment: 'jsdom',
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['src/**/*.test.{js,ts}', 'packages/**/*.test.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**', '**/.svelte-kit/**', 'packages/*/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/dk/**/*.ts', 'packages/core/src/**/*.ts', 'packages/components/src/**/*.{ts,svelte}'],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        'packages/components/src/internal/**',
        'packages/components/src/lib/test-utils/**'
      ],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 85,
        branches: 60
      }
    },
    expect: { requireAssertions: true }
  }
});
