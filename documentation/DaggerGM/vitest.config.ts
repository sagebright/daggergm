import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'node', // Most tests are server-side
    globals: true, // No need to import describe/it/expect

    // Coverage Configuration (99% target)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/types/**', // Generated types
        'src/components/ui/**', // shadcn components (tested via integration)
        'src/app/**', // Next.js routes (tested via E2E)
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
    include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'tests/e2e', // Playwright handles E2E
    ],

    // Setup Files
    setupFiles: ['./tests/setup.ts'],

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
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
})
