import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ExtraPluginProxyRouter } from './plugin.js';

describe('ExtraPluginProxyRouter', () => {
  let plugin: ExtraPluginProxyRouter;
  let serverClosed = false;

  afterEach(async () => {
    if (plugin?.router && !serverClosed) {
      try {
        if (plugin.router.isListening) {
          await plugin.router.close();
          serverClosed = true;
        }
      } catch {
        // Ignore errors when closing
      }
    }
    serverClosed = false;
  });

  describe('constructor', () => {
    test('should create plugin with default options', () => {
      plugin = new ExtraPluginProxyRouter({});

      expect(plugin.name).toBe('proxy-router');
      expect(plugin.router).toBeDefined();
      expect(plugin.framework).toBeNull();
      expect(plugin.noPuppeteerShim).toBe(true);
    });

    test('should create plugin with custom options', () => {
      plugin = new ExtraPluginProxyRouter({
        proxies: {
          DEFAULT: 'http://proxy.example.com:8080',
        },
        collectStats: false,
      });

      expect(plugin.router.proxies).toEqual({
        DEFAULT: 'http://proxy.example.com:8080',
      });
      expect(plugin.router.collectStats).toBe(false);
    });

    test('should merge options with defaults', () => {
      plugin = new ExtraPluginProxyRouter({
        proxyServerOpts: {
          port: 3000,
        },
      });

      expect(plugin.opts.collectStats).toBe(true); // default value
      expect(plugin.opts.proxyServerOpts?.port).toBe(3000); // custom value
    });
  });

  describe('name', () => {
    test('should return plugin name', () => {
      plugin = new ExtraPluginProxyRouter({});

      expect(plugin.name).toBe('proxy-router');
    });
  });

  describe('defaults', () => {
    test('should provide default options', () => {
      plugin = new ExtraPluginProxyRouter({});

      expect(plugin.defaults).toEqual({
        collectStats: true,
        proxyServerOpts: {
          port: 2800,
        },
      });
    });
  });

  describe('proxies getter/setter', () => {
    beforeEach(() => {
      plugin = new ExtraPluginProxyRouter({
        proxies: {
          DEFAULT: 'http://proxy1.example.com:8080',
        },
      });
    });

    test('should get proxies', () => {
      expect(plugin.proxies).toEqual({
        DEFAULT: 'http://proxy1.example.com:8080',
      });
    });

    test('should set proxies', () => {
      plugin.proxies = {
        DEFAULT: 'http://proxy2.example.com:8080',
        CUSTOM: 'http://custom.example.com:8080',
      };

      expect(plugin.proxies).toEqual({
        DEFAULT: 'http://proxy2.example.com:8080',
        CUSTOM: 'http://custom.example.com:8080',
      });
      expect(plugin.router.proxies).toEqual(plugin.proxies);
    });
  });

  describe('stats getter', () => {
    test('should return router stats', () => {
      plugin = new ExtraPluginProxyRouter({});

      expect(plugin.stats).toBe(plugin.router.stats);
    });
  });

  describe('routeByHost getter/setter', () => {
    beforeEach(() => {
      plugin = new ExtraPluginProxyRouter({});
    });

    test('should get routeByHost', () => {
      expect(plugin.routeByHost).toBeNull();
    });

    test('should set routeByHost', () => {
      const routeByHost = async ({ host }: { host: string }) => {
        if (host.includes('google')) return 'DIRECT';
        return 'DEFAULT';
      };

      plugin.routeByHost = routeByHost;

      expect(plugin.routeByHost).toBe(routeByHost);
      expect(plugin.router.routeByHost).toBe(routeByHost);
    });
  });

  describe('proxyBypassListString', () => {
    test('should return undefined when no bypass list', () => {
      plugin = new ExtraPluginProxyRouter({});

      // biome-ignore lint/complexity/useLiteralKeys: accessing private member in test
      expect(plugin['proxyBypassListString']).toBeUndefined();
    });

    test('should return comma-separated list', () => {
      plugin = new ExtraPluginProxyRouter({
        proxyBypassList: ['.com', 'chromium.org', '.domain.com'],
      });

      // biome-ignore lint/complexity/useLiteralKeys: accessing private member in test
      expect(plugin['proxyBypassListString']).toBe(
        '.com,chromium.org,.domain.com'
      );
    });

    test('should return undefined for empty array', () => {
      plugin = new ExtraPluginProxyRouter({
        proxyBypassList: [],
      });

      // biome-ignore lint/complexity/useLiteralKeys: accessing private member in test
      expect(plugin['proxyBypassListString']).toBeUndefined();
    });
  });

  describe('onPluginRegistered', () => {
    beforeEach(() => {
      plugin = new ExtraPluginProxyRouter({});
    });

    test('should set framework to playwright when args provided', async () => {
      await plugin.onPluginRegistered({ framework: 'playwright' });

      expect(plugin.framework).toBe('playwright');
    });

    test('should set framework to puppeteer when no args', async () => {
      await plugin.onPluginRegistered();

      expect(plugin.framework).toBe('puppeteer');
    });

    test('should set framework to puppeteer when args without framework', async () => {
      await plugin.onPluginRegistered({} as any);

      expect(plugin.framework).toBe('puppeteer');
    });
  });

  describe('beforeLaunch', () => {
    beforeEach(() => {
      plugin = new ExtraPluginProxyRouter({
        proxies: {
          DEFAULT: 'http://proxy.example.com:8080',
        },
      });
    });

    test('should start proxy server', async () => {
      await plugin.onPluginRegistered({ framework: 'playwright' });
      const options = {};

      await plugin.beforeLaunch(options);

      expect(plugin.router.isListening).toBe(true);
      expect(plugin.router.proxyServerUrl).toBeDefined();
    });

    test('should configure playwright proxy options', async () => {
      await plugin.onPluginRegistered({ framework: 'playwright' });
      const options: any = {};

      await plugin.beforeLaunch(options);

      expect(options.proxy).toBeDefined();
      expect(options.proxy.server).toBe(plugin.router.proxyServerUrl);
      expect(options.proxy.bypass).toBeUndefined();
    });

    test('should configure playwright proxy with bypass list', async () => {
      plugin = new ExtraPluginProxyRouter({
        proxies: { DEFAULT: 'http://proxy.example.com:8080' },
        proxyBypassList: ['.com', 'example.org'],
      });

      await plugin.onPluginRegistered({ framework: 'playwright' });
      const options: any = {};

      await plugin.beforeLaunch(options);

      expect(options.proxy.bypass).toBe('.com,example.org');
    });

    test('should configure puppeteer proxy args', async () => {
      await plugin.onPluginRegistered(); // defaults to puppeteer
      const options: any = {};

      await plugin.beforeLaunch(options);

      expect(options.args).toBeDefined();
      expect(options.args).toHaveLength(1);
      expect(options.args[0]).toContain('--proxy-server=');
      expect(options.args[0]).toContain(plugin.router.proxyServerUrl);
    });

    test('should append to existing puppeteer args', async () => {
      await plugin.onPluginRegistered();
      const options: any = {
        args: ['--no-sandbox'],
      };

      await plugin.beforeLaunch(options);

      expect(options.args).toHaveLength(2);
      expect(options.args[0]).toBe('--no-sandbox');
      expect(options.args[1]).toContain('--proxy-server=');
    });

    test('should configure puppeteer proxy with bypass list', async () => {
      plugin = new ExtraPluginProxyRouter({
        proxies: { DEFAULT: 'http://proxy.example.com:8080' },
        proxyBypassList: ['.com', 'example.org'],
      });

      await plugin.onPluginRegistered();
      const options: any = {};

      await plugin.beforeLaunch(options);

      expect(options.args).toHaveLength(2);
      expect(options.args[1]).toContain('--proxy-bypass-list=.com,example.org');
    });

    test('should throw error if proxy server not available', async () => {
      plugin = new ExtraPluginProxyRouter({});

      // Mock the listen method to not start the server
      vi.spyOn(plugin.router, 'listen').mockResolvedValue(0);
      const proxyServerUrlSpy = vi
        .spyOn(plugin.router, 'proxyServerUrl', 'get')
        .mockReturnValue(undefined);

      await plugin.onPluginRegistered({ framework: 'playwright' });

      await expect(plugin.beforeLaunch({})).rejects.toThrow(
        'No local proxy server available'
      );

      proxyServerUrlSpy.mockRestore();
    });

    test('should handle unsupported framework', async () => {
      plugin = new ExtraPluginProxyRouter({});
      plugin.framework = null;

      const options: any = {};
      await plugin.beforeLaunch(options);

      expect(options.proxy).toBeUndefined();
      expect(options.args).toBeUndefined();
    });

    test('should work with undefined options', async () => {
      await plugin.onPluginRegistered({ framework: 'playwright' });

      await expect(plugin.beforeLaunch(undefined)).resolves.not.toThrow();
    });

    test('should work with no options', async () => {
      await plugin.onPluginRegistered({ framework: 'playwright' });

      await expect(plugin.beforeLaunch()).resolves.not.toThrow();
    });
  });

  describe('onDisconnected', () => {
    test('should close proxy server', async () => {
      plugin = new ExtraPluginProxyRouter({});
      await plugin.router.listen();

      expect(plugin.router.isListening).toBe(true);

      await plugin.onDisconnected();
      serverClosed = true;

      // The close method is called (we can't easily test if it completed
      // because the proxy-chain library manages the state internally)
    });

    test('should handle close without listening', async () => {
      plugin = new ExtraPluginProxyRouter({});

      // Should not throw even if close returns an error
      await expect(plugin.onDisconnected()).resolves.not.toThrow();
      serverClosed = true;
    });

    test('should handle close errors gracefully', async () => {
      plugin = new ExtraPluginProxyRouter({});
      await plugin.router.listen();

      // Mock the close method to simulate an error
      const closeError = new Error('Close failed');
      const closeSpy = vi
        .spyOn(plugin.router, 'close')
        .mockRejectedValue(closeError);

      // Call onDisconnected which uses .catch to handle errors
      await plugin.onDisconnected();
      serverClosed = true;

      // Verify close was called
      expect(closeSpy).toHaveBeenCalled();

      closeSpy.mockRestore();
    });
  });

  describe('integration', () => {
    test('should work end-to-end with playwright', async () => {
      plugin = new ExtraPluginProxyRouter({
        proxies: {
          DEFAULT: 'http://proxy.example.com:8080',
        },
        proxyBypassList: ['.local'],
      });

      // Register as playwright
      await plugin.onPluginRegistered({ framework: 'playwright' });

      // Launch
      const launchOptions: any = {};
      await plugin.beforeLaunch(launchOptions);

      // Verify configuration
      expect(launchOptions.proxy).toBeDefined();
      expect(launchOptions.proxy.server).toMatch(/^http:\/\/localhost:\d+$/);
      expect(launchOptions.proxy.bypass).toBe('.local');

      // Cleanup
      await plugin.onDisconnected();
      serverClosed = true;
    });

    test('should work end-to-end with puppeteer', async () => {
      plugin = new ExtraPluginProxyRouter({
        proxies: {
          DEFAULT: 'http://proxy.example.com:8080',
        },
        proxyBypassList: ['.local'],
      });

      // Register as puppeteer
      await plugin.onPluginRegistered();

      // Launch
      const launchOptions: any = {
        args: ['--no-sandbox'],
      };
      await plugin.beforeLaunch(launchOptions);

      // Verify configuration
      expect(launchOptions.args).toHaveLength(3);
      expect(launchOptions.args[1]).toMatch(
        /^--proxy-server=http:\/\/localhost:\d+$/
      );
      expect(launchOptions.args[2]).toBe('--proxy-bypass-list=.local');

      // Cleanup
      await plugin.onDisconnected();
      serverClosed = true;
    });
  });
});
