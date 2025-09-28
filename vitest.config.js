import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'server/node_modules/',
        '*.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': './client/js'
    }
  }
});