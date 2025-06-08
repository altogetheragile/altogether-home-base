
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ["src/**/*.test.{ts,tsx}", "src/test/**/*.{test,spec}.{ts,tsx}"],
    typecheck: {
      tsconfig: './tsconfig.test.json'
    }
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
