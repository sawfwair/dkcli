import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/audit.ts', 'src/color.ts', 'src/component-compiler.ts', 'src/component-spec.ts', 'src/compose.ts', 'src/design.ts', 'src/interaction.ts', 'src/layout.ts', 'src/palette.ts', 'src/perception.ts', 'src/saliency.ts', 'src/scale.ts', 'src/theme-contract.ts', 'src/types.ts'],
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
