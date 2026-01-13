import { describe, expect, it } from 'vitest';

import puppeteer from './index';

describe('basic', () => {
  it('is an object', async () => {
    expect(typeof puppeteer).toBe('object');
  });

  it('is an instance of PuppeteerExtra', async () => {
    expect(puppeteer.constructor.name).toBe('PuppeteerExtra');
  });

  it('should have the public class members', async () => {
    expect(puppeteer.use instanceof Function).toBe(true);
    expect(Array.isArray(puppeteer.plugins)).toBe(true);
    expect(Array.isArray(puppeteer.pluginNames)).toBe(true);
    expect(puppeteer.getPluginData instanceof Function).toBe(true);
  });

  it('should have the internal class members', async () => {
    expect('getPluginsByProp' in puppeteer).toBe(true);
    expect('resolvePluginDependencies' in puppeteer).toBe(true);
    expect('orderPlugins' in puppeteer).toBe(true);
    expect('checkPluginRequirements' in puppeteer).toBe(true);
    expect('callPlugins' in puppeteer).toBe(true);
    expect('callPluginsWithValue' in puppeteer).toBe(true);
  });

  it('should have the orginal puppeteer public class members', async () => {
    expect(puppeteer.launch instanceof Function).toBe(true);
    expect(puppeteer.connect instanceof Function).toBe(true);
    expect(puppeteer.executablePath instanceof Function).toBe(true);
    expect(puppeteer.defaultArgs instanceof Function).toBe(true);
    expect(puppeteer.createBrowserFetcher instanceof Function).toBe(true);
  });
});
