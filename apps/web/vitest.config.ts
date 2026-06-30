import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

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
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
