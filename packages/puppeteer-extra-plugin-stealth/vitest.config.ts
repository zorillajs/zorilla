import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 60000,
    pool: {
      threads: {
        maxThreads: 2,
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
  resolve: {
    alias: {
      'puppeteer-extra': '../../packages/puppeteer-extra/src/index.ts',
    },
  },
});
