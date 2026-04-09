import { describe, expect, it } from 'vitest';

import StealthPlugin from '../../puppeteer-extra-plugin-stealth/dist/index.js';
import type { VanillaPuppeteer } from './index.js';
import { addExtra } from './index.js';

type PuppeteerExtraWithResolver = ReturnType<typeof addExtra> & {
  resolvePluginDependencies(): Promise<void>;
};

const fakeVanillaPuppeteer: VanillaPuppeteer = {
  connect: async () => {
    throw new Error('connect should not be called in dependency-loading tests');
  },
  createBrowserFetcher: () => {
    throw new Error(
      'createBrowserFetcher should not be called in dependency-loading tests'
    );
  },
  defaultArgs: () => [],
  executablePath: () => '',
  launch: async () => {
    throw new Error('launch should not be called in dependency-loading tests');
  },
};

describe('dependency loading', () => {
  it('loads scoped stealth evasion dependencies', async () => {
    const puppeteer = addExtra(
      fakeVanillaPuppeteer
    ) as PuppeteerExtraWithResolver;

    puppeteer.use(
      StealthPlugin({
        enabledEvasions: new Set(['chrome.app']),
      })
    );

    await puppeteer.resolvePluginDependencies();

    expect(puppeteer.pluginNames).toContain('stealth');
    expect(puppeteer.pluginNames).toContain('stealth/evasions/chrome.app');
  });

  it('loads nested dependencies declared by stealth evasions', async () => {
    const puppeteer = addExtra(
      fakeVanillaPuppeteer
    ) as PuppeteerExtraWithResolver;

    puppeteer.use(
      StealthPlugin({
        enabledEvasions: new Set(['user-agent-override']),
      })
    );

    await puppeteer.resolvePluginDependencies();

    expect(puppeteer.pluginNames).toContain('stealth');
    expect(puppeteer.pluginNames).toContain(
      'stealth/evasions/user-agent-override'
    );
    expect(puppeteer.pluginNames).toContain('user-preferences');
    expect(puppeteer.pluginNames).toContain('user-data-dir');
  });
});
