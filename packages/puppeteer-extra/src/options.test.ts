import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import puppeteerVanilla from 'puppeteer';
import { beforeEach, describe, expect, it } from 'vitest';
import { addExtra } from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

beforeEach(() => {
  // ESM modules don't have require.cache
});

describe('options', () => {
  it('will modify puppeteer launch options through plugins', async () => {
    let FINAL_OPTIONS = null;

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
      beforeLaunch(options) {
        options.args.push('--foobar=true');
        options.timeout = 60 * 1000;
        options.headless = true;
      }
      afterLaunch(_browser, opts) {
        FINAL_OPTIONS = opts.options;
      }
    }
    const instance = new Plugin();
    puppeteer.use(instance);
    const browser = await puppeteer.launch({
      args: PUPPETEER_ARGS,
      headless: false,
    });

    expect(FINAL_OPTIONS).toEqual({
      headless: true,
      timeout: 60000,
      args: [].concat(PUPPETEER_ARGS, ['--foobar=true']),
    });

    await browser.close();
    expect(true).toBe(true);
  }, 90_000);

  it('will modify puppeteer connect options through plugins', async () => {
    let FINAL_OPTIONS = null;

    // Launch vanilla puppeteer browser with no plugins
    const pptr1 = addExtra(puppeteerVanilla);
    const browserVanilla = await pptr1.launch({
      args: PUPPETEER_ARGS,
    });
    const browserWSEndpoint = browserVanilla.wsEndpoint();

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
      beforeConnect(options) {
        options.foo1 = 60 * 1000;
        options.foo2 = true;
      }
      afterConnect(_browser, opts) {
        FINAL_OPTIONS = opts.options;
      }
    }
    const instance = new Plugin();
    puppeteer.use(instance);
    const browser = await puppeteer.connect({ browserWSEndpoint });

    expect(FINAL_OPTIONS).toEqual({
      foo1: 60 * 1000,
      foo2: true,
      browserWSEndpoint,
    });

    await browser.close();
    expect(true).toBe(true);
  });
});
