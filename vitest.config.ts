
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    include: [
      "src/**/*.test.{ts,tsx}", 
      "src/test/**/*.{test,spec}.{ts,tsx}"
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "coverage/**",
      "e2e/**"
    ],
    typecheck: {
      tsconfig: './tsconfig.test.json',
      enabled: true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // Optimize test execution
    maxConcurrency: 5,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true
      }
    },
    // Better error reporting
    reporter: ['verbose'],
    // Enable MSW debugging
    silent: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    target: 'node14'
  }
})
