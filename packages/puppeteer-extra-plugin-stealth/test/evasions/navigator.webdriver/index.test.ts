import { expect, test } from 'vitest';
import Plugin from '../../../src/evasions/navigator.webdriver/index.js';
import {
  addExtra,
  compareLooseVersionStrings,
  getDefaultLaunchArgs,
  vanillaPuppeteer,
} from '../../util';

function getExpectedValue(looseVersionString) {
  if (compareLooseVersionStrings(looseVersionString, '89.0.4339.0') >= 0) {
    return false;
  } else {
    return undefined;
  }
}

test('vanilla: navigator.webdriver is defined', async () => {
  const browser = await vanillaPuppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const data = await page.evaluate(() => navigator.webdriver);
  expect(data).toBe(true);
});

test('stealth: navigator.webdriver is undefined', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  const data = await page.evaluate(() => navigator.webdriver);
  // XXX: launch this test multiple times with browsers of different versions?
  expect(data).toBe(getExpectedValue(await browser.version()));
});

// https://github.com/zorillajs/zorilla/pull/130
test('stealth: regression: wont kill other navigator methods', async () => {
  const puppeteer = addExtra(vanillaPuppeteer).use(Plugin());
  const browser = await puppeteer.launch({
    headless: true,
    args: getDefaultLaunchArgs(),
  });
  const page = await browser.newPage();

  try {
    const data = await page.evaluate(() => navigator.javaEnabled());
    expect(data).toBe(false);
  } catch (err) {
    expect(err).toBe(undefined);
  }
});
