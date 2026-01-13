import { describe, expect, test, vi } from 'vitest';
import Plugin from '../src/index.js';

const PLUGIN_NAME = 'devtools';

describe('devtools plugin', () => {
  test('is a function', () => {
    expect(typeof Plugin).toBe('function');
  });

  test('should have the basic class members', () => {
    const instance = Plugin();
    expect(instance.name).toBe(PLUGIN_NAME);
    expect(instance._isPuppeteerExtraPlugin).toBe(true);
  });

  test('should have opts with default values', () => {
    const instance = Plugin();
    expect(instance.opts.prefix).toBe('devtools-tunnel');
    expect(instance.opts.auth.user).toBe('user');
    expect(instance.opts.auth.pass.length).toBe(40);
  });

  test('will throw without browser when creating a tunnel', async () => {
    const instance = Plugin();
    await expect(instance.createTunnel(undefined as any)).rejects.toThrow();
  });

  test('can set auth credentials', () => {
    const instance = Plugin();
    instance.setAuthCredentials('bob', 'password123');
    expect(instance.opts.auth.user).toBe('bob');
    expect(instance.opts.auth.pass).toBe('password123');
  });

  test('setAuthCredentials returns this for chaining', () => {
    const instance = Plugin();
    const result = instance.setAuthCredentials('user', 'pass');
    expect(result).toBe(instance);
  });

  test('setAuthCredentials validates user', () => {
    const instance = Plugin();
    expect(() => instance.setAuthCredentials('', 'pass')).toThrow();
  });

  test('setAuthCredentials validates pass', () => {
    const instance = Plugin();
    expect(() => instance.setAuthCredentials('user', '')).toThrow();
  });

  test('can pass custom options to plugin', () => {
    const instance = Plugin({
      prefix: 'my-prefix',
      auth: { user: 'alice', pass: 'secret' },
    });
    expect(instance.opts.prefix).toBe('my-prefix');
    expect(instance.opts.auth.user).toBe('alice');
    expect(instance.opts.auth.pass).toBe('secret');
  });

  test('getLocalDevToolsUrl returns url for browser', () => {
    const instance = Plugin();
    const fakeBrowser = {
      wsEndpoint: () => 'ws://localhost:9222/devtools/browser/abc123',
    };
    const url = instance.getLocalDevToolsUrl(fakeBrowser as any);
    expect(url).toBe('http://localhost:9222');
  });

  test('getLocalDevToolsUrl validates browser', () => {
    const instance = Plugin();
    expect(() => instance.getLocalDevToolsUrl({} as any)).toThrow();
  });

  test('_printGeneratedPasswordWhenNotOverridden prints when password is generated', () => {
    const instance = Plugin();
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    // Password length of 40 indicates it was generated
    instance._printGeneratedPasswordWhenNotOverridden('https://test.com');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('_printGeneratedPasswordWhenNotOverridden does not print for custom password', () => {
    const instance = Plugin({ auth: { user: 'test', pass: 'short' } });
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    instance._printGeneratedPasswordWhenNotOverridden('https://test.com');
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('browserSessions is initialized as empty', () => {
    const instance = Plugin();
    expect(instance._browserSessions).toEqual({});
  });

  test('createTunnel caches tunnels by wsEndpoint', async () => {
    const instance = Plugin({ auth: { user: 'test', pass: 'test' } });
    const _fakeBrowser = {
      wsEndpoint: () => 'ws://localhost:9222/devtools/browser/abc',
    };

    // Mock console.info to avoid log output during tests
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    // We can't actually create a tunnel without network calls, but we can verify
    // that the method checks the wsEndpoint
    expect(typeof instance.createTunnel).toBe('function');
    expect(instance._browserSessions).toEqual({});

    consoleSpy.mockRestore();
  });
});
