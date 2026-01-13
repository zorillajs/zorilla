import { afterEach, describe, expect, test } from 'vitest';
import defaultExport, {
  ExtraPluginProxyRouter,
  ProxyRouter,
  ProxyRouterStandalone,
  ProxyRouterStats,
} from './index.js';

describe('index exports', () => {
  let plugin: ExtraPluginProxyRouter | null = null;

  afterEach(async () => {
    if (plugin?.router.isListening) {
      await plugin.router.close();
    }
    plugin = null;
  });

  describe('default export', () => {
    test('should export default factory function', () => {
      expect(defaultExport).toBeDefined();
      expect(typeof defaultExport).toBe('function');
    });

    test('should create plugin instance without options', () => {
      plugin = defaultExport();

      expect(plugin).toBeInstanceOf(ExtraPluginProxyRouter);
      expect(plugin.name).toBe('proxy-router');
    });

    test('should create plugin instance with options', () => {
      plugin = defaultExport({
        proxies: {
          DEFAULT: 'http://proxy.example.com:8080',
        },
      });

      expect(plugin).toBeInstanceOf(ExtraPluginProxyRouter);
      expect(plugin.proxies).toEqual({
        DEFAULT: 'http://proxy.example.com:8080',
      });
    });

    test('should create plugin instance with empty options', () => {
      plugin = defaultExport({});

      expect(plugin).toBeInstanceOf(ExtraPluginProxyRouter);
    });

    test('should create plugin instance with undefined options', () => {
      plugin = defaultExport(undefined);

      expect(plugin).toBeInstanceOf(ExtraPluginProxyRouter);
    });

    test('should create new instance on each call', async () => {
      const plugin1 = defaultExport();
      const plugin2 = defaultExport();

      expect(plugin1).not.toBe(plugin2);

      // Only close if listening
      if (plugin1.router.isListening) {
        await plugin1.router.close();
      }
      if (plugin2.router.isListening) {
        await plugin2.router.close();
      }
    });
  });

  describe('named exports', () => {
    test('should export ExtraPluginProxyRouter class', () => {
      expect(ExtraPluginProxyRouter).toBeDefined();
      expect(typeof ExtraPluginProxyRouter).toBe('function');

      plugin = new ExtraPluginProxyRouter({});
      expect(plugin).toBeInstanceOf(ExtraPluginProxyRouter);
    });

    test('should export ProxyRouter class', async () => {
      expect(ProxyRouter).toBeDefined();
      expect(typeof ProxyRouter).toBe('function');

      const router = new ProxyRouter();
      expect(router).toBeInstanceOf(ProxyRouter);

      // Only close if listening
      if (router.isListening) {
        await router.close();
      }
    });

    test('should export ProxyRouterStandalone', () => {
      expect(ProxyRouterStandalone).toBeDefined();
      expect(ProxyRouterStandalone).toBe(ProxyRouter);
    });

    test('should export ProxyRouterStats class', () => {
      expect(ProxyRouterStats).toBeDefined();
      expect(typeof ProxyRouterStats).toBe('function');
    });
  });

  describe('type exports', () => {
    test('should be able to use exported types', () => {
      // This tests that the types are properly exported
      // TypeScript will fail to compile if they're not
      const options: Partial<
        import('./plugin.js').ExtraPluginProxyRouterOptions
      > = {
        proxies: {
          DEFAULT: 'http://proxy.example.com:8080',
        },
      };

      plugin = defaultExport(options);
      expect(plugin.proxies.DEFAULT).toBe('http://proxy.example.com:8080');
    });
  });

  describe('re-exports from modules', () => {
    test('should re-export plugin module exports', async () => {
      const pluginModule = await import('./plugin.js');
      expect(ExtraPluginProxyRouter).toBe(pluginModule.ExtraPluginProxyRouter);
    });

    test('should re-export router module exports', async () => {
      const routerModule = await import('./router.js');
      expect(ProxyRouter).toBe(routerModule.ProxyRouter);
      expect(ProxyRouterStandalone).toBe(routerModule.ProxyRouterStandalone);
    });

    test('should re-export stats module exports', async () => {
      const statsModule = await import('./stats.js');
      expect(ProxyRouterStats).toBe(statsModule.ProxyRouterStats);
    });
  });
});
