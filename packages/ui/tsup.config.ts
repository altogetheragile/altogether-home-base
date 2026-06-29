import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/tokens.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  // The consuming apps own React; never bundle it into the design system.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
