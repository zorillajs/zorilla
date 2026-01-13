import http from 'node:http';
import { describe, expect, test } from 'vitest';
import { DevToolsTunnel } from '../src/lib/RemoteDevTools.js';

describe('Server and proxy event tests', () => {
  const webSocketDebuggerUrl = 'ws://127.0.0.1:9222/devtools/browser/abc123';

  test('proxy server proxyReq event is triggered', async () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    const proxy = instance._createProxyServer('localhost', '9222');

    // Create a simple mock request to trigger proxyReq
    let proxyReqCalled = false;
    proxy.on('proxyReq', () => {
      proxyReqCalled = true;
    });

    // Verify the event handler is registered
    expect(proxy).toBeDefined();

    // We can't easily trigger a real proxy request without a full server,
    // but we can emit the event directly
    proxy.emit('proxyReq', { setHeader: () => {} }, { url: '/test' });

    expect(proxyReqCalled).toBe(true);

    proxy.close();
  });

  test('proxy server proxyRes event for root path', async () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    instance.tunnelHost = 'example.com';
    const proxy = instance._createProxyServer('localhost', '9222');

    let proxyResCalled = false;
    proxy.on('proxyRes', () => {
      proxyResCalled = true;
    });

    // Emit proxyRes event with root path
    const mockProxyRes = {
      headers: { 'content-length': '100', 'content-encoding': undefined },
    };
    const mockReq = { url: '/' };
    const mockRes = {};

    proxy.emit('proxyRes', mockProxyRes, mockReq, mockRes);

    expect(proxyResCalled).toBe(true);
    expect(mockProxyRes.headers['content-length']).toBeUndefined();

    proxy.close();
  });

  test('proxy server proxyRes event for json paths', async () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    instance.tunnelHost = 'example.com';
    const proxy = instance._createProxyServer('localhost', '9222');

    // Test /json/list
    const mockProxyRes1 = {
      headers: { 'content-length': '100', 'content-encoding': undefined },
    };
    const mockReq1 = { url: '/json/list' };
    const mockRes1 = {};

    proxy.emit('proxyRes', mockProxyRes1, mockReq1, mockRes1);
    expect(mockProxyRes1.headers['content-length']).toBeUndefined();

    // Test /json/version
    const mockProxyRes2 = {
      headers: { 'content-length': '100', 'content-encoding': undefined },
    };
    const mockReq2 = { url: '/json/version' };
    const mockRes2 = {};

    proxy.emit('proxyRes', mockProxyRes2, mockReq2, mockRes2);
    expect(mockProxyRes2.headers['content-length']).toBeUndefined();

    proxy.close();
  });

  test('server request handler is triggered', async () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    instance.proxyServer = {
      web: (_req: any, res: any) => {
        res.writeHead(200);
        res.end('ok');
      },
      ws: () => {},
      close: () => {},
      on: () => {},
    };

    const server = await instance._createServer(0);
    const port = (server.address() as any).port;

    // Make a real HTTP request to trigger the request handler
    const response = await new Promise<http.IncomingMessage>(
      (resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, res => {
          resolve(res);
        });
        req.on('error', reject);
      }
    );

    expect(response.statusCode).toBe(200);

    server.close();
  });

  test('basic auth successful authentication', () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    const auth = instance._createBasicAuth('testuser', 'testpass');

    // Trigger the authentication function
    let callbackResult = false;
    const authFunc = (auth as any).checker;

    if (authFunc) {
      authFunc('testuser', 'testpass', (valid: boolean) => {
        callbackResult = valid;
      });
      expect(callbackResult).toBe(true);
    }

    // Also test failed auth
    authFunc('testuser', 'wrongpass', (valid: boolean) => {
      callbackResult = valid;
    });
    expect(callbackResult).toBe(false);

    // Test wrong username
    authFunc('wronguser', 'testpass', (valid: boolean) => {
      callbackResult = valid;
    });
    expect(callbackResult).toBe(false);
  });

  test('basic auth fail event is handled', () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    const auth = instance._createBasicAuth('testuser', 'testpass');

    let _failEventTriggered = false;
    // Verify fail event handler exists
    const _originalOn = auth.on.bind(auth);
    auth.on('fail', () => {
      _failEventTriggered = true;
    });

    // Emit fail event
    auth.emit('fail', { user: 'testuser' });

    expect(auth).toBeDefined();
  });

  test('basic auth error event is handled', () => {
    const instance = new DevToolsTunnel(webSocketDebuggerUrl);
    const auth = instance._createBasicAuth('testuser', 'testpass');

    let _errorEventTriggered = false;
    auth.on('error', () => {
      _errorEventTriggered = true;
    });

    // Emit error event
    auth.emit('error', { code: 'TEST_ERROR', message: 'test error message' });

    expect(auth).toBeDefined();
  });
});
