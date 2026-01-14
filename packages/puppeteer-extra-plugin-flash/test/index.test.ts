import { describe, expect, test } from 'vitest';
import Plugin from '../src/index.js';

const PLUGIN_NAME = 'flash';

describe('Plugin instantiation and structure', () => {
  test('should be a function', () => {
    expect(typeof Plugin).toBe('function');
  });

  test('should have the basic class members', () => {
    const instance = Plugin();
    expect(instance.name).toBe(PLUGIN_NAME);
    expect(instance._isPuppeteerExtraPlugin).toBe(true);
  });
});

describe('Default options', () => {
  test('should have opts with default values', () => {
    const instance = Plugin();
    expect(instance.opts.allowFlash).toBe(true);
    expect(instance.opts.pluginPath).toBe(null);
    expect(instance.opts.pluginVersion).toBe(9000);
  });

  test('should allow custom options', () => {
    const instance = Plugin({
      allowFlash: false,
      pluginPath: '/path/to/flash',
      pluginVersion: 32,
    });
    expect(instance.opts.allowFlash).toBe(false);
    expect(instance.opts.pluginPath).toBe('/path/to/flash');
    expect(instance.opts.pluginVersion).toBe(32);
  });
});

describe('Plugin requirements', () => {
  test('should require launch and headful', () => {
    const instance = Plugin();
    const requirements = instance.requirements;
    expect(requirements.has('launch')).toBe(true);
    expect(requirements.has('headful')).toBe(true);
    expect(requirements.size).toBe(2);
  });
});

describe('Plugin dependencies', () => {
  test('should depend on user-preferences plugin', () => {
    const instance = Plugin();
    const dependencies = instance.dependencies;
    expect(
      dependencies.has('@zorilla/puppeteer-extra-plugin-user-preferences')
    ).toBe(true);
    expect(dependencies.size).toBe(1);
  });
});

describe('beforeLaunch method', () => {
  test('should add flash args when allowFlash is true and pluginPath is provided', async () => {
    const instance = Plugin({
      allowFlash: true,
      pluginPath: '/path/to/flash',
      pluginVersion: 32,
    });
    const options = { args: [] as string[] };
    await instance.beforeLaunch(options);
    expect(options.args).toContain('--ppapi-flash-path=/path/to/flash');
    expect(options.args).toContain('--ppapi-flash-version=32');
  });

  test('should not add args when allowFlash is false', async () => {
    const instance = Plugin({ allowFlash: false, pluginPath: '/path' });
    const options = { args: [] as string[] };
    await instance.beforeLaunch(options);
    expect(options.args.length).toBe(0);
  });

  test('should only add pluginPath arg when pluginPath is provided', async () => {
    const instance = Plugin({ pluginPath: '/path/to/flash' });
    const options = { args: [] as string[] };
    await instance.beforeLaunch(options);
    expect(options.args).toContain('--ppapi-flash-path=/path/to/flash');
    expect(options.args).toContain('--ppapi-flash-version=9000');
  });

  test('should handle undefined pluginPath', async () => {
    const instance = Plugin({ pluginPath: null });
    const options = { args: [] as string[] };
    await instance.beforeLaunch(options);
    expect(options.args).toContain('--ppapi-flash-version=9000');
    expect(options.args.filter(a => a.includes('flash-path')).length).toBe(0);
  });

  test('should handle when pluginVersion is not set', async () => {
    const instance = Plugin({ pluginPath: '/path', pluginVersion: undefined });
    const options = { args: [] as string[] };
    await instance.beforeLaunch(options);
    expect(options.args).toContain('--ppapi-flash-path=/path');
    expect(options.args.filter(a => a.includes('flash-version')).length).toBe(
      0
    );
  });
});

describe('Plugin data', () => {
  test('should provide userPreferences data when allowFlash is true', () => {
    const instance = Plugin();
    const data = instance.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].name).toEqual({ userPreferences: true });
    expect(data[0].value.profile.managed_default_content_settings.plugins).toBe(
      1
    );
    expect(data[0].value.profile.managed_plugins_allowed_for_urls).toEqual([
      'https://*',
      'http://*',
    ]);
  });

  test('should return empty array when allowFlash is false', () => {
    const instance = Plugin({ allowFlash: false });
    const data = instance.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });
});
