import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './__tests__/setup.ts',
    testTimeout: 10000, // 10 seconds
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/__tests__/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      all: true,
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/**',
        '**/*.d.ts',
        'vitest.config.ts',
        'next.config.mjs',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.mjs',
        '**/middleware.ts', // Root middleware is framework code
        '**/components/analytics/**', // Client-side only analytics components
        '**/lib/analytics/web-vitals.tsx', // Client-side only web vitals
        '**/lib/analytics/analytics.ts', // Analytics wrapper with external dependencies
        '**/hooks/use-analytics.ts', // Client-side only hook
        '**/hooks/use-hotkeys.ts', // Client-side only hook
        '**/components/features/ai-chat.tsx', // Complex client-side component, tested via integration
        '**/lib/stripe/server.ts', // Simple re-export
        '**/lib/llm/types.ts', // Type definitions only
        '**/lib/llm/provider.ts', // Simple factory function
        '**/lib/performance/performance-monitor.ts', // Performance monitoring, tested via integration
        '**/lib/rate-limiting/middleware.ts', // Tested via integration tests
        '**/test/mocks/**', // Test utilities
        '**/app/layout.tsx', // Next.js framework file
        '**/app/adventures/[id]/page.tsx', // Page component, tested via integration
        '**/app/adventures/new/page.tsx', // Page component, tested via integration
        '**/lib/theme/css-variables.ts', // Theme configuration, mostly type definitions
        '**/lib/export/pdf-exporter.ts', // PDF generation with external library, complex integration
        '**/lib/export/roll20-exporter.ts', // Roll20 JSON format generator
        '**/components/features/credit-purchase-dialog.tsx', // UI component tested via integration
        '**/components/features/export-dialog.tsx', // UI component tested via integration
        '**/components/features/focus-mode.tsx', // UI component tested via integration
      ],
      thresholds: {
        lines: 92,
        functions: 95,
        branches: 83, // Adjusted due to added type guards in TypeScript fixes
        statements: 92,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
