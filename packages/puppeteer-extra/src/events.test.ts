import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import puppeteerVanilla from 'puppeteer';
import { beforeEach, describe, expect, it } from 'vitest';
import { addExtra } from './index.js';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];

beforeEach(() => {
  // ESM modules don't have require.cache
});

describe('events', () => {
  it('will bind launched browser events to plugins', async () => {
    const PLUGIN_EVENTS = [];

    const puppeteer = addExtra(puppeteerVanilla);
    const pluginName = 'hello-world';
    class Plugin extends PuppeteerExtraPlugin {
      constructor(opts = {}) {
        super(opts);
      }
      get name() {
        return pluginName;
      }

      onPluginRegistered() {
        PLUGIN_EVENTS.push('onPluginRegistered');
      }
      beforeLaunch() {
        PLUGIN_EVENTS.push('beforeLaunch');
      }
      afterLaunch() {
        PLUGIN_EVENTS.push('afterLaunch');
      }
      beforeConnect() {
        PLUGIN_EVENTS.push('beforeConnect');
      }
      afterConnect() {
        PLUGIN_EVENTS.push('afterConnect');
      }
      onBrowser() {
        PLUGIN_EVENTS.push('onBrowser');
      }
      onTargetCreated() {
        PLUGIN_EVENTS.push('onTargetCreated');
      }
      onPageCreated() {
        PLUGIN_EVENTS.push('onPageCreated');
      }
      onTargetChanged() {
        PLUGIN_EVENTS.push('onTargetChanged');
      }
      onTargetDestroyed() {
        PLUGIN_EVENTS.push('onTargetDestroyed');
      }
      onDisconnected() {
        PLUGIN_EVENTS.push('onDisconnected');
      }
      onClose() {
        PLUGIN_EVENTS.push('onClose');
      }
    }

    const instance = new Plugin();
    puppeteer.use(instance);
    expect(PLUGIN_EVENTS.includes('onPluginRegistered')).toBe(true);
    const browser = await puppeteer.launch({ args: PUPPETEER_ARGS });
    expect(PLUGIN_EVENTS.includes('beforeLaunch')).toBe(true);
    expect(PLUGIN_EVENTS.includes('afterLaunch')).toBe(true);
    // expect(PLUGIN_EVENTS.includes('beforeConnect')).toBe(false)
    // expect(PLUGIN_EVENTS.includes('afterConnect')).toBe(false)
    expect(PLUGIN_EVENTS.includes('onBrowser')).toBe(true);
    const page = await browser.newPage().catch(console.log);
    expect(PLUGIN_EVENTS.includes('onTargetCreated')).toBe(true);
    expect(PLUGIN_EVENTS.includes('onPageCreated')).toBe(true);
    await page.goto('about:blank#foo').catch(console.log);
    expect(PLUGIN_EVENTS.includes('onTargetChanged')).toBe(true);
    await page.close().catch(console.log);
    expect(PLUGIN_EVENTS.includes('onTargetDestroyed')).toBe(true);
    await browser.close().catch(console.log);
    expect(PLUGIN_EVENTS.includes('onDisconnected')).toBe(true);
    expect(PLUGIN_EVENTS.includes('onClose')).toBe(true);
  });

  it('will bind connected browser events to plugins', async () => {
    const PLUGIN_EVENTS = [];

    // Launch vanilla puppeteer browser with no plugins

    const pptr1 = addExtra(puppeteerVanilla);

    const browserVanilla = await pptr1.launch({
      args: PUPPETEER_ARGS,
    });
    const browserWSEndpoint = browserVanilla.wsEndpoint();

    const puppeteer = addExtra(puppeteerVanilla);
    const pluginName = 'hello-world';
    class Plugin extends PuppeteerExtraPlugin {
      constructor(opts = {}) {
        super(opts);
      }
      get name() {
        return pluginName;
      }

      onPluginRegistered() {
        PLUGIN_EVENTS.push('onPluginRegistered');
      }
      beforeLaunch() {
        PLUGIN_EVENTS.push('beforeLaunch');
      }
      afterLaunch() {
        PLUGIN_EVENTS.push('afterLaunch');
      }
      beforeConnect() {
        PLUGIN_EVENTS.push('beforeConnect');
      }
      afterConnect() {
        PLUGIN_EVENTS.push('afterConnect');
      }
      onBrowser() {
        PLUGIN_EVENTS.push('onBrowser');
      }
      onTargetCreated() {
        PLUGIN_EVENTS.push('onTargetCreated');
      }
      onPageCreated() {
        PLUGIN_EVENTS.push('onPageCreated');
      }
      onTargetChanged() {
        PLUGIN_EVENTS.push('onTargetChanged');
      }
      onTargetDestroyed() {
        PLUGIN_EVENTS.push('onTargetDestroyed');
      }
      onDisconnected() {
        PLUGIN_EVENTS.push('onDisconnected');
      }
      onClose() {
        PLUGIN_EVENTS.push('onClose');
      }
    }

    const instance = new Plugin();
    puppeteer.use(instance);
    expect(PLUGIN_EVENTS.includes('onPluginRegistered')).toBe(true);
    const browser = await puppeteer
      .connect({ browserWSEndpoint })
      .catch(console.log);
    expect(PLUGIN_EVENTS.includes('beforeLaunch')).toBe(false);
    expect(PLUGIN_EVENTS.includes('afterLaunch')).toBe(false);
    expect(PLUGIN_EVENTS.includes('beforeConnect')).toBe(true);
    expect(PLUGIN_EVENTS.includes('afterConnect')).toBe(true);
    expect(PLUGIN_EVENTS.includes('onBrowser')).toBe(true);
    const page = await browser.newPage();
    expect(PLUGIN_EVENTS.includes('onTargetCreated')).toBe(true);
    expect(PLUGIN_EVENTS.includes('onPageCreated')).toBe(true);
    await page.goto('about:blank#foo').catch(console.log);
    expect(PLUGIN_EVENTS.includes('onTargetChanged')).toBe(true);
    await page.close().catch(console.log);
    expect(PLUGIN_EVENTS.includes('onTargetDestroyed')).toBe(true);
    await browser.close().catch(console.log);
    expect(PLUGIN_EVENTS.includes('onDisconnected')).toBe(true);
    expect(PLUGIN_EVENTS.includes('onClose')).toBe(false);
  });
});
