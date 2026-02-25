import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      'puppeteer-extra': path.resolve(
        __dirname,
        '../../packages/puppeteer-extra/dist/index.js'
      ),
    },
  },
});
