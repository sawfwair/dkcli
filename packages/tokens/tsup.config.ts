import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/create-theme.ts', 'src/emit-css.ts', 'src/emit-json.ts'],
  platform: 'neutral',
  target: 'es2022',
  format: ['esm'],
  clean: true,
  dts: { entry: { 'index': '.types/index.d.ts', 'create-theme': '.types/create-theme.d.ts', 'emit-css': '.types/emit-css.d.ts', 'emit-json': '.types/emit-json.d.ts' } },
  sourcemap: false,
  splitting: false,
  shims: false,
  outDir: 'dist'
});
