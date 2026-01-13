import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.vendor/index.js';
import { addExtra, vanillaPuppeteer } from '../../util.js';

test('vanilla: navigator.vendor is always Google Inc.', async () => {
  const browser = await vanillaPuppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const vendor = await page.evaluate(() => navigator.vendor);
  expect(vendor).toBe('Google Inc.');
});

test('stealth: navigator.vendor set to custom value', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(
    Plugin({ vendor: 'Apple Computer, Inc.' })
  );
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const vendor = await page.evaluate(() => navigator.vendor);
  expect(vendor).toBe('Apple Computer, Inc.');
});

test('stealth: will not leak modifications', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const test1 = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(navigator, 'vendor') // Must be undefined if native
  );
  expect(test1).toBe(undefined);

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  );
  expect(test2.includes('vendor')).toBe(false);
});

test('stealth: does patch getters properly', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    const hasInvocationError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        Object.seal(Object.getPrototypeOf(navigator).vendor);
        return false;
      } catch (_err) {
        return true;
      }
    })();
    return {
      hasInvocationError,
      toString: Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(navigator),
        'vendor'
      ).get.toString(),
    };
  });

  expect(results).toEqual({
    hasInvocationError: true,
    toString: 'function get vendor() { [native code] }',
  });
});
