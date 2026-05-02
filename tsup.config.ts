import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'bin/dk': 'src/bin/dk.ts',
    'lib/dk/index': 'src/lib/dk/index.ts'
  },
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  clean: true,
  dts: {
    resolve: true
  },
  sourcemap: false,
  splitting: false,
  shims: false,
  noExternal: [/.*/],
  outDir: 'dist',
  banner({ name }) {
    return name === 'bin/dk' ? { js: '#!/usr/bin/env node' } : {};
  }
});
