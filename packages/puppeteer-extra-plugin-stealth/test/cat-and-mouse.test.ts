import { expect, test } from 'vitest';
import Plugin from '../dist/index.js';
import {
  addExtra,
  compareLooseVersionStrings,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from './util';

// Fix CI issues with old versions
const isOldPuppeteerVersion = () => {
  const version = process.env.PUPPETEER_VERSION;
  const isOld = version && (version === '1.9.0' || version === '1.6.2');
  return isOld;
};

/* global HTMLIFrameElement */
/* global Notification */
test.skip('stealth: will pass Paul Irish (requires user-preferences)', async () => {
  const browser = await addExtra(vanillaPuppeteer)
    .use(Plugin())
    .launch({ headless: true, args: getDefaultLaunchArgs() });
  const page = await browser.newPage();
  await page.exposeFunction(
    'compareLooseVersionStrings',
    compareLooseVersionStrings
  );
  const detectionResults = await page.evaluate(detectHeadless);
  await browser.close();

  if (isOldPuppeteerVersion()) {
    expect(true).toBe(true);
    return;
  }

  const wasHeadlessDetected = Object.values(detectionResults).some(Boolean);
  if (wasHeadlessDetected) {
    console.log(detectionResults);
  }
  expect(wasHeadlessDetected).toBe(false);
});

async function detectHeadless() {
  const results: Record<string, boolean> = {};

  async function test(name: string, fn: () => boolean | Promise<boolean>) {
    const detectionPassed = await fn();
    if (detectionPassed) console.log(`Chrome headless detected via ${name}`);
    results[name] = detectionPassed;
  }

  await test('userAgent', () => {
    return /HeadlessChrome/.test(window.navigator.userAgent);
  });

  // navigator.webdriver behavior change since release 89.0.4339.0. See also #448
  if (
    (await compareLooseVersionStrings(navigator.userAgent, '89.0.4339.0')) >= 0
  ) {
    await test('navigator.webdriver is not false', () => {
      return navigator.webdriver !== false;
    });
  } else {
    // Detects the --enable-automation || --headless flags
    // Will return true in headful if --enable-automation is provided
    await test('navigator.webdriver present', () => {
      return 'webdriver' in navigator;
    });

    await test('navigator.webdriver not undefined', () => {
      return navigator.webdriver !== undefined;
    });

    await test('navigator.webdriver property overridden', () => {
      return (
        Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(navigator),
          'webdriver'
        ) !== undefined
      );
    });

    await test('navigator.webdriver prop detected', () => {
      for (const prop in navigator) {
        if (prop === 'webdriver') {
          return true;
        }
      }
      return false;
    });
  }

  await test('window.chrome missing', () => {
    return /Chrome/.test(window.navigator.userAgent) && !window.chrome;
  });

  await test('permissions API', async () => {
    const permissionStatus = await navigator.permissions.query({
      name: 'notifications',
    });
    return (
      Notification.permission === 'denied' &&
      permissionStatus.state === 'prompt'
    );
  });

  await test('permissions API overriden', () => {
    const permissions = window.navigator.permissions;
    if (permissions.query.toString() !== 'function query() { [native code] }')
      return true;
    if (
      permissions.query.toString.toString() !==
      'function toString() { [native code] }'
    )
      return true;
    if (
      Object.hasOwn(permissions.query.toString, '[[Handler]]') && // eslint-disable-line
      Object.hasOwn(permissions.query.toString, '[[Target]]') && // eslint-disable-line
      Object.hasOwn(permissions.query.toString, '[[IsRevoked]]') // eslint-disable-line
    )
      return true;
    if (Object.hasOwn(permissions, 'query')) return true; // eslint-disable-line
  });

  await test('navigator.plugins empty', () => {
    return navigator.plugins.length === 0;
  });

  await test('navigator.languages blank', () => {
    return navigator.languages.length === 0;
  });

  await test('iFrame for fresh window object', () => {
    // evaluateOnNewDocument scripts don't apply within [srcdoc] (or [sandbox]) iframes
    // https://github.com/GoogleChrome/puppeteer/issues/1106#issuecomment-359313898
    const iframe = document.createElement('iframe');
    iframe.srcdoc = 'page intentionally left blank';
    document.body.appendChild(iframe);

    // Verify iframe prototype isn't touched
    const descriptors = Object.getOwnPropertyDescriptors(
      HTMLIFrameElement.prototype
    );

    if (
      descriptors.contentWindow.get.toString() !==
      'function get contentWindow() { [native code] }'
    )
      return true;
    // Verify iframe isn't remapped to main window
    if (iframe.contentWindow === window) return true;

    // Here we would need to rerun all tests with `iframe.contentWindow` as `window`
    // Example:
    return iframe.contentWindow.navigator.plugins.length === 0;
  });

  // This detects that a devtools protocol agent is attached.
  // So it will also pass true in headful Chrome if the devtools window is attached
  await test('toString', () => {
    let gotYou = 0;
    const spooky = /./;
    spooky.toString = () => {
      gotYou++;
      return 'spooky';
    };
    console.debug(spooky);
    return gotYou > 1;
  });

  return results;
}
