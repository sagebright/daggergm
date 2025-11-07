import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import eslintPluginImport from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import next from '@next/eslint-plugin-next'

export default [
  // Base configurations
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'coverage/**',
      'dist/**',
      '*.config.js',
      '*.config.mjs',
      'documentation/**', // Reference documentation
      '.backups/**', // Timestamped backups
      'test-login.js', // Temporary test file
    ],
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react: react,
      'react-hooks': reactHooks,
      '@next/next': next,
      import: eslintPluginImport,
    },
    rules: {
      // 🎯 DaggerGM-Specific Rules

      // FILE SIZE ENFORCEMENT (300 lines)
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // TypeScript Best Practices
      '@typescript-eslint/no-explicit-any': 'error',
      'no-unused-vars': 'off', // Turn off base rule
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false, // Allow async in onClick handlers
          },
        },
      ],

      // React Best Practices
      'react/prop-types': 'off', // TypeScript handles this
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-no-leaked-render': [
        'error',
        {
          validStrategies: ['ternary', 'coerce'],
        },
      ],

      // Code Quality
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Import Organization
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // Generated types (no line limit)
  {
    files: ['src/types/supabase.ts', 'types/database.generated.ts'],
    rules: {
      'max-lines': 'off', // Generated file from Supabase CLI
      '@typescript-eslint/no-explicit-any': 'off', // Generated types may use any
    },
  },

  // Test files (relaxed rules)
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines': 'off', // Tests can be longer
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test mocks
    },
  },

  // Type files with Zod schemas (allow const/type same name pattern)
  {
    files: ['types/**/*.ts'],
    rules: {
      'no-redeclare': 'off', // Zod enum pattern uses const and type with same name
      '@typescript-eslint/no-redeclare': 'off',
    },
  },

  // Server Actions (strict rules)
  {
    files: ['**/actions/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'Server Actions run on the server, not in the browser',
        },
      ],
    },
  },
]
