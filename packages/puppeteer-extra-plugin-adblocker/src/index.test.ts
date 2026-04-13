import os from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import AdblockerPlugin from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

describe('cache path', () => {
  test('uses a user-specific cache directory by default', () => {
    const plugin = AdblockerPlugin();

    const defaultCacheDir = path.dirname(plugin.engineCacheFile);

    expect(defaultCacheDir).not.toBe(os.tmpdir());

    if (process.platform === 'win32') {
      expect(defaultCacheDir).toContain('zorilla');
      return;
    }

    if (process.platform === 'darwin') {
      expect(defaultCacheDir).toBe(
        path.join(os.homedir(), 'Library', 'Caches', 'zorilla')
      );
      return;
    }

    expect(defaultCacheDir).toBe(
      path.join(
        process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'),
        'zorilla'
      )
    );
  });

  test('keeps honoring a custom cache directory', () => {
    const cacheDir = path.join(os.tmpdir(), 'zorilla-test-cache');
    const plugin = AdblockerPlugin({ cacheDir });

    expect(path.dirname(plugin.engineCacheFile)).toBe(cacheDir);
  });
});

// Skip flaky functional test that depends on external ads
test.skip('will block ads', async () => {
  const loadPuppeteer = new Function(
    "return import('@zorilla/puppeteer-extra')"
  ) as () => Promise<{
    default: {
      use: (plugin: unknown) => void;
      launch: typeof import('puppeteer').launch;
    };
  }>;
  const { default: puppeteer } = await loadPuppeteer();
  const adblockerPlugin = AdblockerPlugin({
    blockTrackers: true,
    useCache: false, // Disable cache for tests to avoid file system issues
  });
  puppeteer.use(adblockerPlugin);

  const browser = await puppeteer.launch({
    args: PUPPETEER_ARGS,
    headless: true,
  });

  const blocker = await adblockerPlugin.getBlocker();

  const page = await browser.newPage();

  let blockedRequests = 0;
  blocker.on('request-blocked', () => {
    blockedRequests += 1;
  });

  let hiddenAds = 0;
  blocker.on('style-injected', () => {
    hiddenAds += 1;
  });

  const url = 'https://www.google.com/search?q=rent%20a%20car';
  await page.goto(url, { waitUntil: 'networkidle0' });

  expect(hiddenAds).not.toBe(0);
  expect(blockedRequests).not.toBe(0);

  await browser.close();
});
