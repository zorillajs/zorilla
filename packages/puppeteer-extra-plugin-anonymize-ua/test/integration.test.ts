import { addExtra } from '@zorilla/puppeteer-extra';
import puppeteer from 'puppeteer';
import { beforeEach, describe, expect, test } from 'vitest';
import Plugin from '../dist/index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

const waitEvent = (emitter: any, eventName: string) =>
  new Promise(resolve => emitter.once(eventName, resolve));

describe('Headless mode (with plugin)', () => {
  let puppeteerExtra: ReturnType<typeof addExtra>;

  beforeEach(() => {
    puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(Plugin());
  });

  test('will remove headless from the user-agent', async () => {
    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded',
    });

    const content = await page.content();
    expect(content.includes('Windows NT 10.0')).toBe(true);
    expect(content.includes('HeadlessChrome')).toBe(false);

    await browser.close();
  });

  test('will remove headless from the user-agent in incognito page', async () => {
    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded',
    });

    const content = await page.content();
    expect(content.includes('Windows NT 10.0')).toBe(true);
    expect(content.includes('HeadlessChrome')).toBe(false);

    await browser.close();
  });

  test('will use a custom fn to modify the user-agent', async () => {
    puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(
      Plugin({
        customFn: ua => 'MyCoolAgent/' + ua.replace('Chrome', 'Beer'),
      })
    );

    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded',
    });

    const content = await page.content();
    expect(content.includes('Windows NT 10.0')).toBe(true);
    expect(content.includes('HeadlessChrome')).toBe(false);
    expect(content.includes('MyCoolAgent/Mozilla')).toBe(true);
    expect(content.includes('Beer/')).toBe(true);

    await browser.close();
  });
});

describe('Disabled options', () => {
  test('will not modify the user-agent when disabled', async () => {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(
      Plugin({
        stripHeadless: false,
        makeWindows: false,
        customFn: null,
      })
    );

    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://httpbin.org/headers', {
      waitUntil: 'domcontentloaded',
    });

    const content = await page.content();
    expect(content.includes('HeadlessChrome')).toBe(true);
    expect(content.includes('MyCoolAgent/Mozilla')).toBe(false);
    expect(content.includes('Beer/')).toBe(false);

    await browser.close();
  });
});

describe('Popup pages', () => {
  test('known issue: will not remove headless from implicitly created popup pages', async () => {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(Plugin());
    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });

    const pages = await Promise.all(
      [...Array(10)].map(() => browser.newPage())
    );
    for (const page of pages) {
      // Works
      const ua = await page.evaluate(() => window.navigator.userAgent);
      expect(ua.includes('HeadlessChrome')).toBe(false);

      // Works
      await page.goto('about:blank');
      const ua2 = await page.evaluate(() => window.navigator.userAgent);
      expect(ua2.includes('HeadlessChrome')).toBe(false);

      // Does NOT work:
      // https://github.com/GoogleChrome/puppeteer/issues/2669
      page.evaluate(url => window.open(url), 'about:blank');
      const popupTarget = await waitEvent(browser, 'targetcreated');
      const popupPage = await popupTarget.page();
      const ua3 = await popupPage.evaluate(() => window.navigator.userAgent);
      // Test against the problem until it's fixed
      expect(ua3.includes('HeadlessChrome')).toBe(true); // should be: false

      // Works: The bug only affects newly created popups, subsequent page navigations are fine.
      await popupPage.goto('about:blank');
      const ua4 = await page.evaluate(() => window.navigator.userAgent);
      expect(ua4.includes('HeadlessChrome')).toBe(false);
    }

    await browser.close();
  });
});

describe('Stress tests', () => {
  test('will remove headless from the user-agent on multiple browsers', async () => {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(Plugin());

    const browsers = await Promise.all(
      [...Array(5)].map(() =>
        puppeteerExtra.launch({ args: PUPPETEER_ARGS, headless: true })
      )
    );
    for (const browser of browsers) {
      const page = await browser.newPage();
      const ua = await page.evaluate(() => window.navigator.userAgent);
      expect(ua.includes('Windows NT 10.0')).toBe(true);
      expect(ua.includes('HeadlessChrome')).toBe(false);
    }

    for (const browser of browsers) {
      await browser.close();
    }
  });

  test('will remove headless from the user-agent on many pages', async () => {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(Plugin());
    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });

    const pages = await Promise.all(
      [...Array(30)].map(() => browser.newPage())
    );
    for (const page of pages) {
      const ua = await page.evaluate(() => window.navigator.userAgent);
      expect(ua.includes('Windows NT 10.0')).toBe(true);
      expect(ua.includes('HeadlessChrome')).toBe(false);
    }

    await browser.close();
  });

  test('will remove headless from the user-agent on many incognito pages', async () => {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(Plugin());
    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });

    const contexts = await Promise.all(
      [...Array(30)].map(() => browser.createBrowserContext())
    );
    for (const context of contexts) {
      const page = await context.newPage();
      const ua = await page.evaluate(() => window.navigator.userAgent);
      expect(ua.includes('Windows NT 10.0')).toBe(true);
      expect(ua.includes('HeadlessChrome')).toBe(false);
    }

    await browser.close();
  });

  test('will remove headless from the user-agent on many pages in parallel', async () => {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(Plugin());
    const browser = await puppeteerExtra.launch({
      args: PUPPETEER_ARGS,
      headless: true,
    });

    const testCase = async () => {
      const page = await browser.newPage();
      const ua = await page.evaluate(() => window.navigator.userAgent);
      expect(ua.includes('Windows NT 10.0')).toBe(true);
      expect(ua.includes('HeadlessChrome')).toBe(false);
    };
    await Promise.all([...Array(30)].map(() => testCase()));

    await browser.close();
  });
});
