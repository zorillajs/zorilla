import os from 'node:os';
import path from 'node:path';

import { Request } from '@ghostery/adblocker-puppeteer';
import { afterEach, describe, expect, test } from 'vitest';

import AdblockerPlugin from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];
const originalFetch = globalThis.fetch;

const CUSTOM_FILTERS = [
  '||custom-filter-test.invalid/blocked.js$script',
  'custom-filter-test.invalid##.ad-banner',
];

const requestFor = (url: string) =>
  Request.fromRawDetails({
    url,
    type: 'script',
    sourceUrl: 'https://site.test/',
    sourceHostname: 'site.test',
    sourceDomain: 'site.test',
  });

afterEach(() => {
  globalThis.fetch = originalFetch;
});

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

describe('custom filters', () => {
  test('uses distinct cache files for different custom filter configurations', () => {
    const first = AdblockerPlugin({ filters: '||one.test^' });
    const second = AdblockerPlugin({ filters: '||two.test^' });
    const merged = AdblockerPlugin({
      filters: '||one.test^',
      mergeFilters: true,
    });

    expect(first.engineCacheFile).not.toBe(second.engineCacheFile);
    expect(first.engineCacheFile).not.toBe(merged.engineCacheFile);
  });

  test('builds a custom-only blocker without fetching prebuilt lists', async () => {
    globalThis.fetch = (async () => {
      throw new Error('unexpected fetch');
    }) as typeof fetch;

    const blocker = await AdblockerPlugin({
      filters: CUSTOM_FILTERS,
      useCache: false,
    }).getBlocker();

    expect(
      blocker.match(requestFor('https://custom-filter-test.invalid/blocked.js'))
        .match
    ).toBe(true);
    expect(
      blocker.match(requestFor('https://custom-filter-test.invalid/allowed.js'))
        .match
    ).toBe(false);

    const cosmeticMatches = blocker.matchCosmeticFilters({
      url: 'https://custom-filter-test.invalid/',
      hostname: 'custom-filter-test.invalid',
      domain: 'custom-filter-test.invalid',
      classes: ['ad-banner'],
      hrefs: [],
      ids: [],
      getRulesFromDOM: true,
      getRulesFromHostname: true,
    });

    expect(cosmeticMatches.matches).toHaveLength(1);
  });

  test('falls back to prebuilt lists when custom filters are empty', async () => {
    globalThis.fetch = (async () => {
      throw new Error('prebuilt fetch attempted');
    }) as typeof fetch;

    await expect(
      AdblockerPlugin({ filters: [], useCache: false }).getBlocker()
    ).rejects.toThrow('prebuilt fetch attempted');

    await expect(
      AdblockerPlugin({ filters: '', useCache: false }).getBlocker()
    ).rejects.toThrow('prebuilt fetch attempted');
  });

  test('fetches prebuilt lists when custom filters are merged', async () => {
    globalThis.fetch = (async () => {
      throw new Error('prebuilt fetch attempted');
    }) as typeof fetch;

    await expect(
      AdblockerPlugin({
        filters: CUSTOM_FILTERS,
        mergeFilters: true,
        useCache: false,
      }).getBlocker()
    ).rejects.toThrow('prebuilt fetch attempted');
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
