import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.js'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.js',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
      ],
    },
  },
});
