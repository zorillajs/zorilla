import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.languages/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  getStealthFingerPrint,
  getVanillaFingerPrint,
  vanillaPuppeteer,
} from '../../util.js';

// TODO: Vanilla seems fine, evasion obsolete?
// Note: We keep it around for now, as we will need this method in a fingerprinting plugin later anyway
test.skip('vanilla: is array with en-US (requires fpcollect)', async () => {
  const { languages } = await getVanillaFingerPrint();
  expect(Array.isArray(languages)).toBe(true);
  expect(languages[0]).toBe('en-US');
});

test('vanilla: will not have modifications', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(navigator, 'languages') // Must be undefined if native
  );
  expect(test1).toBe(undefined);

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  );
  expect(test2.includes('languages')).toBe(false);
});

test.skip('stealth: is array with en-US (requires fpcollect)', async () => {
  const { languages } = await getStealthFingerPrint(Plugin);
  expect(Array.isArray(languages)).toBe(true);
  expect(languages[0]).toBe('en-US');
});

test.skip('stealth: customized value (requires fpcollect)', async () => {
  const { languages } = await getStealthFingerPrint(Plugin, null, {
    languages: ['foo', 'bar'],
  });
  expect(languages).toEqual(['foo', 'bar']);
});

test('stealth: will not leak modifications', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await page.evaluate(
    () => Object.getOwnPropertyDescriptor(navigator, 'languages') // Must be undefined if native
  );
  expect(test1).toBe(undefined);

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  );
  expect(test2.includes('languages')).toBe(false);
});

test('stealth: does patch getters properly', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const results = await page.evaluate(() => {
    const hasInvocationError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        Object.seal(Object.getPrototypeOf(navigator).languages);
        return false;
      } catch (_err) {
        return true;
      }
    })();
    const hasPushError = (() => {
      try {
        // eslint-disable-next-line dot-notation
        navigator.languages.push(null);
        return false;
      } catch (_err) {
        return true;
      }
    })();
    return {
      hasInvocationError,
      hasPushError,
      toString: Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(navigator),
        'languages'
      ).get.toString(),
    };
  });

  expect(results).toEqual({
    hasInvocationError: true,
    hasPushError: true,
    toString: 'function get languages() { [native code] }',
  });
});
