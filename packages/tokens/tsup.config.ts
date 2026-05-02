import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/create-theme.ts', 'src/emit-css.ts', 'src/emit-json.ts'],
  platform: 'neutral',
  target: 'es2022',
  format: ['esm'],
  clean: true,
  dts: true,
  sourcemap: false,
  splitting: false,
  shims: false,
  outDir: 'dist'
});
