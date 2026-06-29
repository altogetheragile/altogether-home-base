import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/tokens.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  // The consuming apps own React and the component runtime deps (Radix, cva, clsx,
  // tailwind-merge) — never bundle them into the design system.
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@radix-ui/react-slot',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
  ],
});
