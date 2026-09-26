import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/HoldingPage.tsx',
    'src/index.ts',
    'src/tokens.ts',
    'src/brand.ts',
    'src/modules.ts',
    'src/editor/*.ts',
    'src/editor/*.tsx',
    'src/components/ui/*.tsx',
    '!src/components/ui/*.stories.tsx',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  // No shared chunks, and therefore no content-hashed filenames.
  //
  // dist is committed, because the apps install on their own and cannot build it. With splitting
  // on, 31 of its 43 files were chunk-<HASH>.js, and every change to any source file renamed
  // several of them. Two branches touching this package then met as a rename against a rename,
  // which no reading of either side can resolve: the correct answer is neither, it is whatever
  // the build produces from the merged source. That happened on three pull requests in a day.
  //
  // Off, each entry is self-contained and its filename never changes. The cost is some duplicated
  // code between entries, which the consuming bundlers tree-shake away, and it buys a dist whose
  // diffs are readable and whose merges are ordinary.
  splitting: false,
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
