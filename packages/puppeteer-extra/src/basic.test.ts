import { describe, expect, it, vi } from 'vitest';
import puppeteer, { addExtra, type VanillaPuppeteer } from './index';

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

  it('reports when legacy createBrowserFetcher is unavailable', () => {
    const vanilla = {
      connect: async () => {
        throw new Error('not used');
      },
      defaultArgs: () => [],
      executablePath: () => '',
      launch: async () => {
        throw new Error('not used');
      },
    } as VanillaPuppeteer;

    expect(() => addExtra(vanilla).createBrowserFetcher()).toThrow(
      'createBrowserFetcher is not available in this version of Puppeteer.'
    );
  });

  it('forwards legacy createBrowserFetcher when available', () => {
    const createBrowserFetcher = vi.fn(() => ({ legacy: true }));
    const extra = addExtra({
      ...puppeteer,
      createBrowserFetcher,
    });

    expect(extra.createBrowserFetcher({ path: '/tmp/browser-cache' })).toEqual({
      legacy: true,
    });
    expect(createBrowserFetcher).toHaveBeenCalledWith({
      path: '/tmp/browser-cache',
    });
  });
});
