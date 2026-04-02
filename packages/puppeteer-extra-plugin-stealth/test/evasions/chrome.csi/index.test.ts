import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/chrome.csi/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util';

/* global chrome */

test('stealth: will add functional chrome.csi function mock', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({
      runOnInsecureOrigins: true, // for testing
    })
  );
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    type ChromeCsi = {
      onloadT: number;
      startE: number;
      pageT: number;
      tran: number;
    };
    const chromeCsi = (window.chrome as { csi: () => ChromeCsi }).csi;
    const { timing } = window.performance;
    const csi = chromeCsi();

    return {
      csi: {
        exists: window.chrome && 'csi' in window.chrome,
        toString: chromeCsi.toString(),
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
