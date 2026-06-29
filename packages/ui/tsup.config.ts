import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/tokens.ts',
    'src/components/ui/*.tsx',
    '!src/components/ui/*.stories.tsx',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  // The consuming apps own React and every component runtime dep (Radix, cva, clsx,
  // tailwind-merge, lucide) — never bundle them into the design system.
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'lucide-react',
    /^@radix-ui\//,
  ],
});
