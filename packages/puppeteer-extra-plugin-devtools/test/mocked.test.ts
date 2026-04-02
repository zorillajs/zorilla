import type { Browser } from '@zorilla/puppeteer-extra-plugin/puppeteer';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Store event handlers for testing
let tunnelEventHandlers: Record<string, any> = {};

// Mock all external dependencies before importing the modules
vi.mock('localtunnel', () => ({
  default: vi.fn((options: any) => {
    const tunnel = {
      url: `https://${options.subdomain}.localtunnel.me`,
      close: vi.fn(),
      on: vi.fn((event: string, handler: any) => {
        tunnelEventHandlers[event] = handler;
        return tunnel;
      }),
    };
    return Promise.resolve(tunnel);
  }),
}));

let portCounter = 12345;
vi.mock('get-port', () => ({
  default: vi.fn(() => Promise.resolve(portCounter++)),
}));

const mockFetch = vi.fn((url: string | URL) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(
      `${url}`.includes('/json/version')
        ? { Browser: 'Chrome/91.0', 'Protocol-Version': '1.3' }
        : [
            {
              id: 'page1',
              type: 'page',
              url: 'about:blank',
              webSocketDebuggerUrl: 'ws://localhost:9222/devtools/page/page1',
            },
          ]
    ),
  } as unknown as Response)
);
vi.stubGlobal('fetch', mockFetch);

describe('Mocked integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('createTunnel creates and caches tunnel', async () => {
    const { default: Plugin } = await import('../src/index.js');
    const instance = Plugin({ auth: { user: 'test', pass: 'test123' } });

    const fakeBrowser = {
      wsEndpoint: () => 'ws://localhost:9222/devtools/browser/abc123',
    } as Browser;

    // Mock console.info to suppress output
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const tunnel = await instance.createTunnel(fakeBrowser);

    expect(tunnel).toBeDefined();
    expect(tunnel.url).toContain('localtunnel.me');

    // Verify tunnel is cached
    expect(Object.keys(instance._browserSessions)).toHaveLength(1);

    // Calling again with same browser should return cached tunnel
    const tunnel2 = await instance.createTunnel(fakeBrowser);
    expect(tunnel2).toBe(tunnel);

    consoleSpy.mockRestore();
  });

  test('createTunnel creates separate tunnels for different browsers', async () => {
    const { default: Plugin } = await import('../src/index.js');
    const instance = Plugin({ auth: { user: 'test', pass: 'test123' } });

    const fakeBrowser1 = {
      wsEndpoint: () => 'ws://localhost:9222/devtools/browser/abc123',
    } as Browser;

    const fakeBrowser2 = {
      wsEndpoint: () => 'ws://localhost:9223/devtools/browser/def456',
    } as Browser;

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const tunnel1 = await instance.createTunnel(fakeBrowser1);
    const tunnel2 = await instance.createTunnel(fakeBrowser2);

    expect(tunnel1).not.toBe(tunnel2);
    expect(Object.keys(instance._browserSessions)).toHaveLength(2);

    consoleSpy.mockRestore();
  });

  test('Tunnel getUrlForPage returns correct URL', async () => {
    const { default: Plugin } = await import('../src/index.js');
    const instance = Plugin({ auth: { user: 'test', pass: 'test123' } });

    const fakeBrowser = {
      wsEndpoint: () => 'ws://localhost:9222/devtools/browser/abc123',
    } as Browser;

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const tunnel = await instance.createTunnel(fakeBrowser);

    const fakePage = {
      _target: {
        _targetInfo: {
          targetId: 'page123',
        },
      },
    } as any;

    const url = tunnel.getUrlForPage(fakePage);
    expect(url).toContain('localtunnel.me');
    expect(url).toContain('page123');
    expect(url).toContain('wss=');

    consoleSpy.mockRestore();
  });

  test('Tunnel close method works', async () => {
    const { default: Plugin } = await import('../src/index.js');
    const instance = Plugin({ auth: { user: 'test', pass: 'test123' } });

    const fakeBrowser = {
      wsEndpoint: () => 'ws://localhost:9222/devtools/browser/abc123',
    } as Browser;

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const tunnel = await instance.createTunnel(fakeBrowser);

    const result = tunnel.close();
    expect(result).toBe(tunnel);

    consoleSpy.mockRestore();
  });

  test('DevToolsTunnel.create full integration', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    const instance = new DevToolsTunnel('ws://localhost:9222/devtools', {
      prefix: 'test-tunnel',
      auth: { user: 'admin', pass: 'secret' },
    });

    const result = await instance.create();

    expect(result).toBe(instance);
    expect(instance.url).toContain('localtunnel.me');
    expect(instance.tunnelHost).toBeDefined();
    expect(instance.server).toBeDefined();
    expect(instance.proxyServer).toBeDefined();

    // Clean up
    instance.close();
  });

  test('DevToolsTunnel.create with custom subdomain', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    const instance = new DevToolsTunnel('ws://localhost:9222/devtools', {
      subdomain: 'my-custom-subdomain',
      auth: { user: 'admin', pass: 'secret' },
    });

    const result = await instance.create();

    expect(result).toBe(instance);
    expect(instance.url).toContain('my-custom-subdomain');

    // Clean up
    instance.close();
  });

  test('DevToolsTunnel.create without auth', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    const instance = new DevToolsTunnel('ws://localhost:9222/devtools', {
      prefix: 'test-no-auth',
      auth: { user: null, pass: null },
    });

    const result = await instance.create();

    expect(result).toBe(instance);
    expect(instance.url).toBeDefined();

    // Clean up
    instance.close();
  });

  test('fetchVersion returns version info', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    const instance = new DevToolsTunnel('ws://localhost:9222/devtools');
    const version = await instance.fetchVersion();

    expect(version).toBeDefined();
    expect(version.Browser).toContain('Chrome');
  });

  test('fetchList returns page list', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    const instance = new DevToolsTunnel('ws://localhost:9222/devtools');
    const list = await instance.fetchList();

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  test('tunnel close event is handled', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    tunnelEventHandlers = {}; // Reset
    const instance = new DevToolsTunnel('ws://localhost:9222/devtools', {
      prefix: 'test-close',
      auth: { user: 'admin', pass: 'secret' },
    });

    await instance.create();

    // Trigger the close event
    if (tunnelEventHandlers.close) {
      tunnelEventHandlers.close();
    }

    expect(tunnelEventHandlers.close).toBeDefined();

    instance.close();
  });

  test('tunnel error event is handled', async () => {
    const { DevToolsTunnel } = await import('../src/lib/RemoteDevTools.js');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    tunnelEventHandlers = {}; // Reset
    const instance = new DevToolsTunnel('ws://localhost:9222/devtools', {
      prefix: 'test-error',
      auth: { user: 'admin', pass: 'secret' },
    });

    await instance.create();

    // Trigger the error event
    if (tunnelEventHandlers.error) {
      const testError = new Error('test error');
      tunnelEventHandlers.error(testError);
      expect(consoleSpy).toHaveBeenCalledWith('tunnel error', testError);
    }

    expect(tunnelEventHandlers.error).toBeDefined();

    instance.close();
    consoleSpy.mockRestore();
  });
});
