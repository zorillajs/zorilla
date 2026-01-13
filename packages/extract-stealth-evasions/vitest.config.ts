import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
      all: true,
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
    environment: 'node',
    globals: true,
  },
});
