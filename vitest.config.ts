import path from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'jsdom', // Support both client and server components
    globals: true, // No need to import describe/it/expect

    // Coverage Configuration (90% target)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/types/**', // Generated types
        '**/components/ui/**', // shadcn components (tested via integration)
        '**/app/layout.tsx', // Next.js framework files
        '**/app/page.tsx', // Page components (tested via E2E)
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '*.config.{ts,mjs,js}',
        '**/middleware.ts',
      ],

      // 🎯 DaggerGM Coverage Thresholds
      // MVP: 90% overall, 100% for security-critical code
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },

      // Fail if uncovered files exist
      all: true,
      skipFull: false,
    },

    // Test Organization
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/tests/integration/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'tests/e2e', // Playwright handles E2E
      '__tests__/e2e/**',
    ],

    // Setup Files
    setupFiles: ['./__tests__/setup.ts', './tests/setup.ts'],

    // Timeouts
    testTimeout: 10000, // 10s for integration tests
    hookTimeout: 10000,

    // Performance
    isolate: true, // Run each test file in isolation
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4, // Adjust based on CI
      },
    },

    // Reporter
    reporters: ['verbose'],

    // Watch Mode
    watchExclude: ['**/node_modules/**', '**/.next/**', '**/coverage/**'],
  },

  // Path Resolution (match tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/features': path.resolve(__dirname, './features'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/types': path.resolve(__dirname, './types'),
      '@/stores': path.resolve(__dirname, './stores'),
      '@/tests': path.resolve(__dirname, './tests'),
      '@/app': path.resolve(__dirname, './app'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/test': path.resolve(__dirname, './test'),
    },
  },
})
