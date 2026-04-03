/* global Notification */
import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.permissions/index.js';
import {
  addExtra,
  getDefaultLaunchArgs,
  getStealthFingerPrint,
  getVanillaFingerPrint,
  vanillaPuppeteer,
} from '../../util';

test.skip('vanilla: is prompt (requires fpcollect)', async () => {
  const { permissions } = await getVanillaFingerPrint();
  expect(permissions).toEqual({
    permission: 'denied',
    state: 'prompt', // this is WRONG behavior, it's "denied" in headful!
  });
});

test.skip('stealth: is denied (requires fpcollect)', async () => {
  const { permissions } = await getStealthFingerPrint(Plugin);
  expect(permissions).toEqual({
    permission: 'denied',
    state: 'denied', // this is FIXED behavior, it's "denied" in headful!
  });
});

async function getNotificationPermission() {
  const { state, onchange } = await navigator.permissions.query({
    name: 'notifications',
  });
  return {
    state,
    onchange,
    permission: Notification.permission,
  };
}

test.skipIf(process.env.CI)('vanilla headful: as expected', async () => {
  const puppeteer = addExtra(vanillaPuppeteer);
  const browser = await puppeteer.launch({
    headless: false,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  const result = await page.evaluate(getNotificationPermission);
  expect(result).toEqual({
    state: 'denied',
    onchange: null,
    permission: 'denied',
  });

  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
  });
  const result2 = await page.evaluate(getNotificationPermission);
  expect(result2).toEqual({
    state: 'prompt',
    onchange: null,
    permission: 'default',
  });
});

test('vanilla headless: as expected', async () => {
  const puppeteer = addExtra(vanillaPuppeteer);
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  const result = await page.evaluate(getNotificationPermission);
  expect(result).toEqual({
    state: 'denied', // Chrome now properly denies in headless mode
    onchange: null,
    permission: 'denied',
  });

  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
  });

  const result2 = await page.evaluate(getNotificationPermission);
  expect(result2).toEqual({
    state: 'prompt',
    onchange: null,
    permission: 'default', // Changes to default after navigation
  });
});

test('stealth headless: as vanilla headful', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();
  const result = await page.evaluate(getNotificationPermission);
  expect(result).toEqual({
    state: 'denied',
    onchange: null,
    permission: 'denied',
  });

  await page.goto('https://example.com', {
    waitUntil: 'domcontentloaded',
  });

  const result2 = await page.evaluate(getNotificationPermission);
  expect(result2).toEqual({
    state: 'prompt',
    onchange: null,
    permission: 'default',
  });
});
