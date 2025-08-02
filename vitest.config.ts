import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**'
      ]
    },
    setupFiles: ['./test-setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@coworking/ui': resolve(__dirname, './packages/ui'),
      '@coworking/utils': resolve(__dirname, './packages/utils'),
      '@coworking/config': resolve(__dirname, './packages/config'),
      '@coworking/database': resolve(__dirname, './packages/database'),
      '@coworking/auth': resolve(__dirname, './packages/auth')
    }
  }
})