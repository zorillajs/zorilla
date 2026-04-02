import { describe, expect, test, vi } from 'vitest';
import {
  DevToolsCommon,
  DevToolsLocal,
  DevToolsTunnel,
} from '../src/lib/RemoteDevTools.js';

const webSocketDebuggerUrl = 'ws://127.0.0.1:9222/devtools/browser/abc123';

describe('RemoteDevTools', () => {
  describe('DevToolsCommon', () => {
    test('is a function', () => {
      expect(typeof DevToolsCommon).toBe('function');
    });

    test('can be instantiated', () => {
      const instance = new DevToolsCommon(webSocketDebuggerUrl);
      expect(instance.wsUrl).toBe(webSocketDebuggerUrl);
      expect(instance.wsHost).toBe('localhost');
      expect(instance.wsPort).toBe('9222');
    });

    test('validates webSocketDebuggerUrl', () => {
      expect(() => new DevToolsCommon('invalid' as any)).toThrow();
    });

    test('validates ws:// protocol', () => {
      expect(() => new DevToolsCommon('http://localhost:9222')).toThrow();
    });

    test('converts 127.0.0.1 to localhost', () => {
      const instance = new DevToolsCommon('ws://127.0.0.1:9222/devtools');
      expect(instance.wsHost).toBe('localhost');
    });

    test('keeps non-127.0.0.1 hostname as is', () => {
      const instance = new DevToolsCommon('ws://192.168.1.1:9222/devtools');
      expect(instance.wsHost).toBe('192.168.1.1');
    });

    test('fetchVersion returns version info', async () => {
      const instance = new DevToolsCommon(webSocketDebuggerUrl);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi
          .fn()
          .mockResolvedValue({ Browser: 'Chrome', 'Protocol-Version': '1.3' }),
      } as unknown as Response);
      vi.stubGlobal('fetch', mockFetch);

      await expect(instance.fetchVersion()).resolves.toEqual({
        Browser: 'Chrome',
        'Protocol-Version': '1.3',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9222/json/version'
      );
      vi.unstubAllGlobals();
    });

    test('fetchList returns list of targets', async () => {
      const instance = new DevToolsCommon(webSocketDebuggerUrl);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([{ id: 'page1', type: 'page' }]),
      } as unknown as Response);
      vi.stubGlobal('fetch', mockFetch);

      await expect(instance.fetchList()).resolves.toEqual([
        { id: 'page1', type: 'page' },
      ]);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:9222/json/list');
      vi.unstubAllGlobals();
    });

    test('fetchVersion rejects on non-2xx responses', async () => {
      const instance = new DevToolsCommon(webSocketDebuggerUrl);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      } as unknown as Response);
      vi.stubGlobal('fetch', mockFetch);

      await expect(instance.fetchVersion()).rejects.toThrow(
        'Request failed with status 503'
      );
      vi.unstubAllGlobals();
    });
  });

  describe('DevToolsLocal', () => {
    test('is a function', () => {
      expect(typeof DevToolsLocal).toBe('function');
    });

    test('can be instantiated', () => {
      const instance = new DevToolsLocal(webSocketDebuggerUrl);
      expect(instance.wsUrl).toBe(webSocketDebuggerUrl);
    });

    test('returns correct url', () => {
      const instance = new DevToolsLocal(webSocketDebuggerUrl);
      expect(instance.url).toBe('http://localhost:9222');
    });

    test('getUrlForPageId returns correct deep link', () => {
      const instance = new DevToolsLocal(webSocketDebuggerUrl);
      const url = instance.getUrlForPageId('page123');
      expect(url).toBe(
        'http://localhost:9222/devtools/inspector.html?ws=localhost:9222/devtools/page/page123'
      );
    });
  });

  describe('DevToolsTunnel', () => {
    test('is a function', () => {
      expect(typeof DevToolsTunnel).toBe('function');
    });

    test('can be instantiated', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      expect(instance.wsUrl).toBe(webSocketDebuggerUrl);
    });

    test('has correct defaults', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      expect(instance.defaults.prefix).toBe('devtools-tunnel');
      expect(instance.defaults.subdomain).toBe(null);
      expect(instance.defaults.auth.user).toBe(null);
      expect(instance.defaults.auth.pass).toBe(null);
    });

    test('merges options with defaults', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl, {
        prefix: 'custom-prefix',
      });
      expect(instance.opts.prefix).toBe('custom-prefix');
    });

    test('_generateSubdomain creates valid subdomain', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const subdomain = instance._generateSubdomain('test-prefix');
      expect(subdomain).toMatch(/^test-prefix-[a-z0-9_-]+$/i);
      expect(subdomain.length).toBeGreaterThan(12); // at least prefix + dash + some random chars
    });

    test('_generateSubdomain creates different subdomains', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const subdomain1 = instance._generateSubdomain('test');
      const subdomain2 = instance._generateSubdomain('test');
      expect(subdomain1).not.toBe(subdomain2);
    });

    test('_createBasicAuth creates auth instance', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const auth = instance._createBasicAuth('user', 'pass');
      expect(auth).toBeDefined();
    });

    test('_modifyFetchToIncludeCredentials modifies fetch calls', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const input = 'fetch(url).then(response => response.json())';
      const output = instance._modifyFetchToIncludeCredentials(input);
      expect(output).toContain("fetch(url, {credentials: 'include'})");
    });

    test('_modifyFetchToIncludeCredentials handles undefined body', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const output = instance._modifyFetchToIncludeCredentials('' as any);
      expect(output).toBeUndefined();
    });

    test('_modifyFetchToIncludeCredentials fixes devtools frontend URL', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const input =
        'link.href = `https://chrome-devtools-frontend.appspot.com/serve_file';
      const output = instance._modifyFetchToIncludeCredentials(input);
      expect(output).toContain('link.href = item.devtoolsFrontendUrl;');
    });

    test('_modifyJSONResponse returns undefined for empty body', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const output = instance._modifyJSONResponse('' as any);
      expect(output).toBeUndefined();
    });

    test('_modifyJSONResponse replaces host and protocol', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      instance.tunnelHost = 'example.com';
      const input =
        '[{"devtoolsFrontendUrl":"/devtools/inspector.html?ws=localhost:9222/devtools/page/123","webSocketDebuggerUrl":"ws://localhost:9222/devtools/page/123"}]';
      const output = instance._modifyJSONResponse(input);
      expect(output).toContain('example.com');
      expect(output).toContain('wss://');
      expect(output).toContain('wss=');
    });

    test('_createProxyServer creates proxy', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      const proxy = instance._createProxyServer('localhost', '9222');
      expect(proxy).toBeDefined();
      expect(typeof proxy.web).toBe('function');
    });

    test('getUrlForPageId returns correct deep link', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      instance.tunnelHost = 'example.com';
      const url = instance.getUrlForPageId('page123');
      expect(url).toBe(
        'https://example.com/devtools/inspector.html?wss=example.com/devtools/page/page123'
      );
    });

    test('url getter returns tunnel url', () => {
      const instance = new DevToolsTunnel(webSocketDebuggerUrl);
      instance.tunnel = { url: 'https://test.localtunnel.me' };
      expect(instance.url).toBe('https://test.localtunnel.me');
    });
  });
});
