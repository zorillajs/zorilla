import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.plugins/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  getStealthFingerPrint,
  getVanillaFingerPrint,
  vanillaPuppeteer,
} from '../../util';

type FingerPrintWithPlugins = {
  plugins: {
    length: number;
  };
  mimeTypes: {
    length: number;
  };
};

test.skip('vanilla: empty plugins, empty mimetypes (requires fpcollect)', async () => {
  const { plugins, mimeTypes } =
    await getVanillaFingerPrint<FingerPrintWithPlugins>();
  expect(plugins.length).toBe(0);
  expect(mimeTypes.length).toBe(0);
});

test('vanilla: will not have modifications', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await page.evaluate(() => ({
    mimeTypes: Object.getOwnPropertyDescriptor(navigator, 'mimeTypes'), // Must be undefined if native
    plugins: Object.getOwnPropertyDescriptor(navigator, 'plugins'), // Must be undefined if native
  }));
  expect(test1.mimeTypes).toBe(undefined);
  expect(test1.plugins).toBe(undefined);

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  );
  expect(test2.includes('plugins')).toBe(false);
});

test.skip('stealth: has plugin, has mimetypes (requires fpcollect)', async () => {
  const { plugins, mimeTypes } =
    await getStealthFingerPrint<FingerPrintWithPlugins>(Plugin);
  expect(plugins.length).toBe(3);
  expect(mimeTypes.length).toBe(4);
});

test('stealth: will not leak modifications', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const test1 = await page.evaluate(() => ({
    mimeTypes: Object.getOwnPropertyDescriptor(navigator, 'mimeTypes'), // Must be undefined if native
    plugins: Object.getOwnPropertyDescriptor(navigator, 'plugins'), // Must be undefined if native
  }));
  expect(test1.mimeTypes).toBe(undefined);
  expect(test1.plugins).toBe(undefined);

  const test2 = await page.evaluate(
    () => Object.getOwnPropertyNames(navigator) // Must be an empty array if native
  );
  expect(test2.includes('plugins')).toBe(false);
});
