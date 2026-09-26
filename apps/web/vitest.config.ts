import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { createRequire } from 'node:module';

// Resolved from this file, so it finds React wherever this project's install happens to put it.
const require_ = createRequire(import.meta.url);

// Test config for the Next site. jsdom + React Testing Library, with the `@/` alias
// matching tsconfig so components and their `@/lib/...` imports resolve the same way.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // A component from @altogether/ui imports react/jsx-runtime, and that bare import resolves
      // from the package's real path: packages/ui/node_modules, then the repository root. Neither
      // exists when this project installs on its own, as it does in CI, so a test that renders a
      // shared component failed there and nowhere else.
      //
      // next.config.mjs solves the same problem for the build by looking in this project's own
      // node_modules. This is that, for the test runner.
      ...['react/jsx-runtime', 'react/jsx-dev-runtime'].map((id) => ({
        find: new RegExp(`^${id.replace('/', '\\/')}$`),
        replacement: require_.resolve(id),
      })),
    ],
    // One React, whichever path reaches it. Two copies is how a shared component gets a null
    // useState instead of a hook.
    dedupe: ['react', 'react-dom'],
  },
});
