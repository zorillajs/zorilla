import puppeteer from '@zorilla/puppeteer-extra';
import { expect, test } from 'vitest';

import AdblockerPlugin from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

// Skip flaky functional test that depends on external ads
test.skip('will block ads', async () => {
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
