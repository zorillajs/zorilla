import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/dist/**'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
});
