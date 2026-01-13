import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/chrome.csi/index.js';
import { addExtra, vanillaPuppeteer } from '../../util.js';

/* global chrome */

test('stealth: will add functional chrome.csi function mock', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      runOnInsecureOrigins: true, // for testing
    })
  );
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    const { timing } = window.performance;
    const csi = window.chrome.csi();

    return {
      csi: {
        exists: window.chrome && 'csi' in window.chrome,
        toString: chrome.csi.toString(),
      },
      dataOK: {
        onloadT: csi.onloadT === timing.domContentLoadedEventEnd,
        startE: csi.startE === timing.navigationStart,
        pageT: typeof csi.pageT === 'number',
        tran: Number.isInteger(csi.tran),
      },
    };
  });

  expect(results).toEqual({
    csi: {
      exists: true,
      toString: 'function () { [native code] }',
    },
    dataOK: {
      onloadT: true,
      pageT: true,
      startE: true,
      tran: true,
    },
  });
});
