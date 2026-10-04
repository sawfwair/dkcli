import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/audit.ts', 'src/color.ts', 'src/component-compiler.ts', 'src/component-spec.ts', 'src/compose.ts', 'src/design.ts', 'src/interaction.ts', 'src/layout.ts', 'src/palette.ts', 'src/perception.ts', 'src/saliency.ts', 'src/scale.ts', 'src/theme-contract.ts', 'src/types.ts'],
  platform: 'neutral',
  target: 'es2022',
  format: ['esm'],
  clean: true,
  dts: { entry: { 'index': '.types/index.d.ts', 'audit': '.types/audit.d.ts', 'color': '.types/color.d.ts', 'component-compiler': '.types/component-compiler.d.ts', 'component-spec': '.types/component-spec.d.ts', 'compose': '.types/compose.d.ts', 'design': '.types/design.d.ts', 'interaction': '.types/interaction.d.ts', 'layout': '.types/layout.d.ts', 'palette': '.types/palette.d.ts', 'perception': '.types/perception.d.ts', 'saliency': '.types/saliency.d.ts', 'scale': '.types/scale.d.ts', 'theme-contract': '.types/theme-contract.d.ts', 'types': '.types/types.d.ts' } },
  sourcemap: false,
  splitting: false,
  shims: false,
  outDir: 'dist'
});
