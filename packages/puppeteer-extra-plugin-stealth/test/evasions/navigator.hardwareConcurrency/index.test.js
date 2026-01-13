import os from 'node:os';
import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.hardwareConcurrency/index.js';
import {
  addExtra,
  getStealthFingerPrint,
  getVanillaFingerPrint,
  vanillaPuppeteer,
} from '../../util.js';

const fingerprintFn = page => page.evaluate('navigator.hardwareConcurrency');

test.skip('vanilla: matches real core count (requires fpcollect)', async () => {
  const { pageFnResult } = await getVanillaFingerPrint(fingerprintFn);
  expect(pageFnResult).toBe(os.cpus().length);
});

test.skip('stealth: default is set to 4 (requires fpcollect)', async () => {
  const { pageFnResult } = await getStealthFingerPrint(Plugin, fingerprintFn);
  expect(pageFnResult).toBe(4);
});

test.skip('stealth: will override value correctly (requires fpcollect)', async () => {
  const { pageFnResult } = await getStealthFingerPrint(Plugin, fingerprintFn, {
    hardwareConcurrency: 8,
  });
  expect(pageFnResult).toBe(8);
});

test('stealth: does patch getters properly', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    const hasInvocationError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        Object.seal(Object.getPrototypeOf(navigator).hardwareConcurrency);
        return false;
      } catch (_err) {
        return true;
      }
    })();
    return {
      hasInvocationError,
      toString: Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(navigator),
        'hardwareConcurrency'
      ).get.toString(),
    };
  });

  expect(results).toEqual({
    hasInvocationError: true,
    toString: 'function get hardwareConcurrency() { [native code] }',
  });
});
