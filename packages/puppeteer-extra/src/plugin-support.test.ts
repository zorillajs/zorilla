import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import puppeteerVanilla from 'puppeteer';
import { beforeEach, describe, expect, it } from 'vitest';
import { addExtra } from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];
const PAGE_TIMEOUT = 60 * 1000; // 60s

beforeEach(() => {
  // ESM modules don't have require.cache
});

describe('plugin-support', () => {
  it('will launch the browser normally', async () => {
    const puppeteer = addExtra(puppeteerVanilla);
    const browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
    const page = await browser.newPage();
    await page.goto('about:blank', {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_TIMEOUT,
    });
    await browser.close();
    expect(true).toBe(true);
  });

  it('will launch puppeteer with plugin support', async () => {
    const puppeteer = addExtra(puppeteerVanilla);
    const pluginName = 'hello-world';
    const pluginData = [{ name: 'foo', value: 'bar' }];
    class Plugin extends PuppeteerExtraPlugin {
      constructor(opts = {}) {
        super(opts);
      }
      get name() {
        return pluginName;
      }
      get data() {
        return pluginData;
      }
    }
    const instance = new Plugin();
    puppeteer.use(instance);
    const browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
    const page = await browser.newPage();

    expect(puppeteer.plugins.length).toBe(1);
    expect(puppeteer.plugins[0].name).toBe(pluginName);
    expect(puppeteer.pluginNames.length).toBe(1);
    expect(puppeteer.pluginNames[0]).toBe(pluginName);
    expect(puppeteer.getPluginData().length).toBe(1);
    expect(puppeteer.getPluginData()[0]).toEqual(pluginData[0]);
    expect(puppeteer.getPluginData('foo')[0]).toEqual(pluginData[0]);
    expect(puppeteer.getPluginData('not-existing').length).toBe(0);

    await page.goto('about:blank', {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_TIMEOUT,
    });
    await browser.close();
    expect(true).toBe(true);
  });
});
